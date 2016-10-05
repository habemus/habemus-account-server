// native dependencies
const fs = require('fs');
const path = require('path');

// third-party
const Bluebird = require('bluebird');

const ACTION_NAME = 'resetPassword';
const CODE_LENGTH = 15;
const TRAILING_SLASH_RE = /\/$/;
const CONSTANTS = require('../../shared/constants');

module.exports = function (app, options) {

  const errors = app.errors;

  const User = app.services.mongoose.models.User;

  const FROM_EMAIL      = options.fromEmail;
  const PUBLIC_HOST_URI = options.publicHostURI.replace(TRAILING_SLASH_RE, '');
  const UI_HOST_URI     = options.uiHostURI.replace(TRAILING_SLASH_RE, '');

  var pwdResetCtrl = {};

  /**
   * Creates a reset request
   * @param  {String} email
   * @return {Bluebird}
   */
  pwdResetCtrl.createRequest = function (email) {

    if (!email) {
      return Bluebird.reject(new errors.InvalidOption(
        'email',
        'required',
        'email is required to create a password reset request'
      ));
    }

    var _account;

    // load account
    return app.controllers.account.getByEmail(email)
      .then((account) => {
        // save the account for later usage
        _account = account;

        var accountId = account.get('_id').toString();

        return app.controllers.protectedRequest.create(accountId, ACTION_NAME, {
          expiresIn: '1h',
          codeLength: CODE_LENGTH,
        });
      })
      .then((confirmationCode) => {

        var email    = _account.get('email');
        var name     = _account.get('name');
        var username = _account.get('username');

        /**
         * Address to which reset data MUST be sent
         * 
         * @type {String}
         */
        var resetSubmitURL  = PUBLIC_HOST_URI + '/reset-password';

        /**
         * Code and username are base64 encoded
         * 
         * @type {Buffer}
         */
        var data = new Buffer(JSON.stringify({
          code: confirmationCode,
          username: username,
        })).toString('base64');

        /**
         * URL that points to the h-account's host
         * At that page, the user will be allowed to define a
         * new password and be redirected according to success or failure
         *  
         * @type {String}
         */
        var pwdResetUiURL = [
          UI_HOST_URI,
          CONSTANTS.UI_PASSWORD_RESET_PATH,
          '?d=' + data,
          '&submit=' + resetSubmitURL,
          // '&success=' + resetSuccessURL,
          // '&error=' + resetErrorURL,
        ].join('');

        return app.services.hMailer.schedule({
          from: FROM_EMAIL,
          to: email,
          template: 'account/password-reset.html',
          data: {
            name: name,
            email: email,
            code: confirmationCode,
            url: pwdResetUiURL,
          },
        });
      })
      .then((passwordResetMailRequestId) => {
        return;
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

    return app.controllers.account.getByUsername(username)
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
      });
  };

  return pwdResetCtrl;
};