// native dependencies
const fs = require('fs');
const path = require('path');

// third-party
const Bluebird = require('bluebird');
const uuid     = require('node-uuid');
const ms       = require('ms');

const hLock  = require('h-lock');

const DEFAULT_CODE_LENGTH = 7;
const DEFAULT_VERIFICATION_EXPIRY = ms('1d');

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

  var protectedRequestCtrl = {};

  /**
   * Creates a verification request
   * @param  {String} userId
   * @param  {String} actionName
   * @return {Bluebird}
   */
  protectedRequestCtrl.create = function (userId, actionName, options) {

    // parse out options
    var codeLength = options.codeLength || DEFAULT_CODE_LENGTH;
    var expiresIn = options.expiresIn || DEFAULT_VERIFICATION_EXPIRY;
    expiresIn = (typeof expiresIn === 'string') ? ms(expiresIn) : expiresIn;
    
    // generate a code
    var confirmationCode = _genCode(DEFAULT_CODE_LENGTH);

    // cancel all previous verification requests
    return protectedRequestCtrl.cancelUserRequests(userId, actionName, 'NewRequestMade')
      .then(() => {
        // create a lock using the confirmationCode
        return app.services._auxiliaryLock.create(confirmationCode);
      })
      .then((lockId) => {

        // create a ProtectedActionRequest
        var actionRequest = new ProtectedActionRequest({
          userId: userId,
          action: actionName,
          lockId: lockId,
          status: app.constants.REQUEST_STATUSES.pending,
          expiresAt: Date.now() + expiresIn,
        });

        return actionRequest.save();
      })
      .then((request) => {
        return confirmationCode;
      });
  };

  /**
   * Cancel all account verification requests 
   * for a given user and 
   * for a given reason
   * @param  {String} userId
   * @param  {String} reason
   * @return {Bluebird -> void}
   */
  protectedRequestCtrl.cancelUserRequests = function (userId, actionName, reason) {

    var requestQuery = {
      // load all requests of a given user
      userId: userId,
      // for the verification action
      action: actionName,
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
   * Attempt to verify a user with a verificationCode
   * @param  {String} userId
   * @param  {String} confirmationCode
   * @return {Bluebird}
   */
  protectedRequestCtrl.verifyRequestConfirmationCode = function (userId, actionName, confirmationCode) {

    var requestQuery = {
      // request for the userId
      userId: userId,
      // for the verification action
      action: actionName,
      // which status is at pending (was not cancelled nor fulfilled)
      status: app.constants.REQUEST_STATUSES.pending,

      // let the expiry verification be made at the application
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

    var _request;

    // load the request that originated the verification flow
    return Bluebird.resolve(ProtectedActionRequest.findOne(requestQuery))
      .then((request) => {

        _request = request;

        if (!request) {
          // request was not even found
          // verification code must be invalid
          // 
          // this is a very special situation,
          // when someone is trying to verify against non-existent request
          return Bluebird.reject(new app.Error('InvalidVerificationCode'));
        }

        if (request.hasExpired()) {
          return Bluebird.reject(new app.Error('VerificationCodeExpired'));
        }

        // get the lock and attempt to unlock it
        var lockId = request.get('lockId');

        return app.services._auxiliaryLock.unlock(
          // unlock the lock
          lockId,
          // using code
          confirmationCode,
          // and let the app's default attempter be the one blamed
          // for attempting to unlock
          app.constants.ATTEMPTER_ID
        );

      })
      .then(() => {
        // set the request's status
        _request.set('status', app.constants.REQUEST_STATUSES.fulfilled);
        return _request.save();
      })
      .then(() => {
        // make sure to return nothing
        return;
      })
      .catch((err) => {

        if (err instanceof hLock.errors.InvalidSecret) {
          return Bluebird.reject(new app.Error('InvalidVerificationCode'))
        }

        // default behavior is to reject with the original error
        return Bluebird.reject(err);
      });
  };

  return protectedRequestCtrl;
};