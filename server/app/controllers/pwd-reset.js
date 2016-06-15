// native dependencies
const fs = require('fs');
const path = require('path');

// third-party
const Bluebird = require('bluebird');
const uuid     = require('node-uuid');
const ms       = require('ms');

const hLock  = require('h-lock');

const ACTION_NAME = 'resetPassword';
const CODE_LENGTH = 15;

/**
 * Emailing stuff.
 * TODO: study whether this should be moved to a separate service
 */
const mustache = require('mustache');
const resetPasswordEmailTemplate = fs.readFileSync(path.join(__dirname, '../../email-templates/reset-password.html'), 'utf8');

module.exports = function (app, options) {

  const errors = app.errors;

  const ProtectedActionRequest = app.models.ProtectedActionRequest;
  const User                   = app.models.User;

  const FROM_EMAIL = options.fromEmail;

  var pwdResetCtrl = {};

  /**
   * Creates a reset request
   * @param  {String} userId
   * @return {Bluebird}
   */
  pwdResetCtrl.createRequest = function (username) {

    if (!username) {
      return Bluebird.reject(new errors.InvalidOption(
        'username',
        'required',
        'username is required to create a password reset request'
      ));
    }

    var _user;

    // load user
    return app.controllers.user.getByUsername(username)
      .then((user) => {
        // save the user for later usage
        _user = user;

        var userId = user.get('_id').toString();

        return app.controllers.protectedRequest.create(userId, ACTION_NAME, {
          expiresIn: '1h',
          codeLength: CODE_LENGTH,
        });
      })
      .then((confirmationCode) => {

        // setup e-mail data
        var mailOptions = {
          from: FROM_EMAIL,
          to: _user.get('email'),
          subject: 'Habemus password reset',
          html: mustache.render(resetPasswordEmailTemplate, {
            email: _user.get('email'),
            code: confirmationCode,
          }),
        };

        return new Bluebird((resolve, reject) => {
          app.services.nodemailer.sendMail(mailOptions, function (err, sentEmailInfo) {
            if (err) { reject(err); }

            // make sure returns nothing
            resolve();
          });
        });
      });
  };

  /**
   * Attempt to reset a user's password with a resetCode
   * @param  {String} username
   * @param  {String} pwdResetCode
   * @return {Bluebird}
   */
  pwdResetCtrl.resetPassword = function (username, confirmationCode, password) {

    if (!username) {
      return Bluebird.reject(new errors.InvalidOption(
        'username',
        'required',
        'username is required to reset password'
      ));
    }

    if (!confirmationCode) {
      return Bluebird.reject(new errors.InvalidOption(
        'confirmationCode',
        'required',
        'confirmationCode is required to reset password'
      ));
    }

    if (!password) {
      return Bluebird.reject(new errors.InvalidOption(
        'password',
        'required',
        'password is required to reset password'
      ));
    }

    var _user;

    return app.controllers.user.getByUsername(username)
      .then((user) => {
        _user = user;

        return app.controllers.protectedRequest.verifyRequestConfirmationCode(
          _user.get('_id').toString(),
          ACTION_NAME,
          confirmationCode
        );
      })
      .then(() => {
        // successfully unlocked

        // reset existing lock for the account
        // instead of creating a new one
        var _accLockId = _user.get('_accLockId');

        return app.services.accountLock.reset(_accLockId, password);
      })
      .then(() => {
        // finished
        // make sure to return nothing
        return;
      })
      .catch((err) => {

        if (err instanceof hLock.errors.InvalidSecret) {
          return Bluebird.reject(new errors.InvalidCredentials());
        }

        // default behavior is to reject with the original error
        return Bluebird.reject(err);
      });
  };

  return pwdResetCtrl;
};