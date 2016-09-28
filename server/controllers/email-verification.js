// native dependencies
const fs = require('fs');
const path = require('path');

// third-party
const Bluebird = require('bluebird');

// constants
const ACTION_NAME = 'verifyAccountEmail';
const CODE_LENGTH = 5;
const CONSTANTS = require('../../shared/constants');
const TRAILING_SLASH_RE = /\/$/;

module.exports = function (app, options) {

  const errors = app.errors;

  const Account = app.services.mongoose.models.Account;

  const FROM_EMAIL  = options.fromEmail;
  const HOST_URI    = options.hostURI.replace(TRAILING_SLASH_RE, '');

  var emailVerificationCtrl = {};

  /**
   * Creates a verification request
   * @param  {String} username
   * @return {Bluebird}
   */
  emailVerificationCtrl.createRequest = function (username) {
    if (!username) {
      return Bluebird.reject(new errors.InvalidOption(
        'username',
        'required',
        'username is required for verification request'
      ));
    }

    var _account;

    // load account
    return app.controllers.account.getByUsername(username)
      .then((account) => {
        // save the account for later usage
        _account = account;

        return app.controllers.protectedRequest.create(account._id, ACTION_NAME, {
          expiresIn: '1d',
          codeLength: CODE_LENGTH,
        });
      })
      .then((confirmationCode) => {

        var email    = _account.get('email');
        var name     = _account.get('name');
        var username = _account.get('username');

        /**
         * URL that points to the h-account's host
         * From that path, the user will be redirected according
         * to success or failure of verification.
         * 
         * @type {String}
         */
        var confirmationURL = HOST_URI + '/account/' + username + '/verify-email?code=' + confirmationCode;

        return app.services.hMailer.schedule({
          from: FROM_EMAIL,
          to: email,
          template: 'account/email-verification.html',
          data: {
            name: name,
            email: email,
            code: confirmationCode,
            url: confirmationURL
          }
        });
      })
      .then((verificationMailRequestId) => {
        _account.set('status.detail', {
          verificationMailRequestId: verificationMailRequestId
        });

        return _account.save().then(() => {
          // return nothing
          return;
        });
      });
  };

  /**
   * Attempt to verify a user with a verificationCode
   * @param  {String} username
   * @param  {String} confirmationCode
   * @return {Bluebird}
   */
  emailVerificationCtrl.verifyAccountEmail = function (username, confirmationCode) {
    if (!username) {
      return Bluebird.reject(new errors.InvalidOption(
        'username',
        'required',
        'username is required for verifying account'
      ));
    }

    if (!confirmationCode) {
      return Bluebird.reject(new errors.InvalidOption(
        'confirmationCode',
        'required',
        'confirmationCode is required for verifying account'
      ));
    }

    var _account;

    return app.controllers.account.getByUsername(username)
      .then((account) => {
        _account = account;

        return app.controllers.protectedRequest
          .verifyRequestConfirmationCode(account._id, ACTION_NAME, confirmationCode)
      })
      .then(() => {
        // successfully unlocked
        
        // change the account status to active
        _account.setStatus(
          CONSTANTS.ACCOUNT_STATUSES.VERIFIED,
          'VerificationSuccess'
        );

        return _account.save();
      })
      .catch((err) => {
        if (err instanceof errors.UserNotFound) {
          // in case user not found, as this is a sensitive
          // method, we should return InvalidCredentials
          return Bluebird.reject(new errors.InvalidCredentials());
        }

        // by default reject using original error
        return Bluebird.reject(err);
      });
  };

  return emailVerificationCtrl;
};