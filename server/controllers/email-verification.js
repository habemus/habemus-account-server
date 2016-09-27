// native dependencies
const fs = require('fs');
const path = require('path');

// third-party
const Bluebird = require('bluebird');

// constants
const ACTION_NAME = 'verifyAccountEmail';
const CODE_LENGTH = 5;
const CONSTANTS = require('../../shared/constants')

module.exports = function (app, options) {

  const errors = app.errors;

  const Account = app.services.mongoose.models.Account;

  const FROM_EMAIL = options.fromEmail;

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

        return app.services.hMailer.schedule({
          from: FROM_EMAIL,
          to: _account.get('email'),
          template: 'account/verification.html',
          data: {
            name: _account.get('name'),
            email: _account.get('email'),
            code: confirmationCode,
          }
        });

        // // setup e-mail data
        // var mailOptions = {
        //   from: FROM_EMAIL,
        //   to: _account.get('email'),
        //   subject: 'Welcome to Habemus',
        //   html: mustache.render(verifyAccountEmailTemplate, {
        //     email: _account.get('email'),
        //     code: confirmationCode,
        //   }),
        // };

        // return new Bluebird((resolve, reject) => {
        //   app.services.nodemailer.sendMail(mailOptions, function (err, sentEmailInfo) {
        //     if (err) { reject(err); }

        //     // make sure to return nothing
        //     resolve();
        //   });
        // });
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