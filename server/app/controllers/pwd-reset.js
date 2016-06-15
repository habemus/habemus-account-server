// native dependencies
const fs = require('fs');
const path = require('path');

// third-party
const Bluebird = require('bluebird');
const uuid     = require('node-uuid');
const ms       = require('ms');

const hLock  = require('h-lock');

const ACTION_NAME = 'resetPassword';
const DEFAULT_PASSWORD_RESET_EXPIRY = ms('1h');
const CODE_LENGTH = 15;

/**
 * Emailing stuff.
 * TODO: study whether this should be moved to a separate service
 */
const mustache = require('mustache');
const resetPasswordEmailTemplate = fs.readFileSync(path.join(__dirname, '../../email-templates/reset-password.html'), 'utf8');

/**
 * Auxiliary function that generates a random code of given length
 * @param  {Number} length
 * @return {String}
 */
function _genCode(length) {
  var code = uuid.v4().replace(/-/g, '').toUpperCase();

  if (length > code.length) {
    throw new Error(length + ' is not supported');
  }

  return code.substr(0, length);
}

module.exports = function (app, options) {

  const ProtectedActionRequest = app.models.ProtectedActionRequest;
  const User                   = app.models.User;

  const FROM_EMAIL = options.fromEmail;

  var pwdResetCtrl = {};

  /**
   * Creates a reset request
   * @param  {String} userId
   * @return {Bluebird}
   */
  pwdResetCtrl.createRequest = function (userId) {
    // generate a code
    var pwdResetCode = _genCode(CODE_LENGTH);

    var _user;

    // load user
    return app.controllers.user.getById(userId)
      .then((user) => {
        // save the user for later usage
        _user = user;

        // cancel all previous reset requests
        return pwdResetCtrl.cancelAllRequests(userId, 'NewRequestMade');
      })
      .then(() => {
        // create a lock using the pwdResetCode
        return app.services._auxiliaryLock.create(pwdResetCode);
      })
      .then((lockId) => {

        // create a ProtectedActionRequest
        var actionRequest = new ProtectedActionRequest({
          userId: _user.get('_id').toString(),
          action: ACTION_NAME,
          lockId: lockId,
          status: app.constants.REQUEST_STATUSES.pending,
          expiresAt: Date.now() + DEFAULT_PASSWORD_RESET_EXPIRY,
        });

        return actionRequest.save();
      })
      .then((actionRequest) => {

        // setup e-mail data
        var mailOptions = {
          from: FROM_EMAIL,
          to: _user.get('email'),
          subject: 'Habemus password reset',
          html: mustache.render(resetPasswordEmailTemplate, {
            email: _user.get('email'),
            code: pwdResetCode,
          }),
        };

        return new Bluebird((resolve, reject) => {
          app.services.nodemailer.sendMail(mailOptions, function (err, sentEmailInfo) {
            if (err) { reject(err); }

            resolve(sentEmailInfo);
          });
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  /**
   * Cancel all password reset requests 
   * for a given user and 
   * for a given reason
   * @param  {String} userId
   * @param  {String} reason
   * @return {Bluebird -> void}
   */
  pwdResetCtrl.cancelAllRequests = function (userId, reason) {

    var requestQuery = {
      // load all requests of a given user
      userId: userId,
      // for the reset action
      action: ACTION_NAME,
      // whose status is at pending
      status: app.constants.REQUEST_STATUSES.pending,
    };

    return Bluebird.resolve(ProtectedActionRequest.update(requestQuery, {
      status: app.constants.REQUEST_STATUSES.cancelled,
      cancelReason: reason,
    }))
    .then(() => {
      return;
    });

  };

  /**
   * Attempt to verify a user with a resetCode
   * @param  {String} userId
   * @param  {String} pwdResetCode
   * @return {Bluebird}
   */
  pwdResetCtrl.resetPassword = function (userId, pwdResetCode, newPwd) {

    var requestQuery = {
      // request for the userId
      userId: userId,
      // for the reset action
      action: ACTION_NAME,
      // which status is at pending (was not cancelled nor fulfilled)
      status: app.constants.REQUEST_STATUSES.pending,

      // let the expiry reset be made at the application
      // level so that we may inform the user about the expiry
      // expiresAt:
    }

    /**
     * These options are to guarantee that only the latest
     * request will be checked against, so that if any inconsistencies
     * in the database happen, the latest request prevails.
     * @type {Object}
     */
    var requestFindOptions = {
      sort: {
        // load latest
        createdAt: -1
      }
    }

    var _user;

    // load the request that originated the reset flow
    return Bluebird.resolve(ProtectedActionRequest.findOne(requestQuery))
      .then((request) => {

        if (!request) {
          // request was not even found
          // reset code must be invalid
          // 
          // this is a very special situation,
          // when someone is trying to verify against non-existent request
          return Bluebird.reject(new app.Error('InvalidPasswordResetCode'));
        }

        if (request.hasExpired()) {
          return Bluebird.reject(new app.Error('ResetCodeExpired'));
        }

        // get the lock and attempt to unlock it
        var lockId = request.get('lockId');

        return app.services._auxiliaryLock.unlock(
          // unlock the lock
          lockId,
          // using code
          pwdResetCode,
          // and let the app's default attempter be the one blamed
          // for attempting to unlock
          app.constants.ATTEMPTER_ID
        );

      })
      .then(() => {
        // successfully unlocked
        
        // load the user
        return app.controllers.user.getById(userId);
      })
      .then((user) => {
        // save the user
        _user = user;

        // create a new lock for the user using the new password
        return app.services.accountLock.create(newPwd);
      })
      .then((lockId) => {
        // set user's _accLockId
        _user.set('_accLockId', lockId);

        return _user.save();
      })
      .then(() => {
        // finished
        // make sure to return nothing
        return;
      })
      .catch((err) => {

        if (err instanceof hLock.errors.InvalidSecret) {
          return Bluebird.reject(new app.Error('InvalidPasswordResetCode'))
        }

        // default behavior is to reject with the original error
        return Bluebird.reject(err);
      });
  };

  return pwdResetCtrl;
};