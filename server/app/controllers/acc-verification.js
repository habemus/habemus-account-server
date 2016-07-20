// native dependencies
const fs = require('fs');
const path = require('path');

// third-party
const Bluebird = require('bluebird');
const uuid     = require('node-uuid');
const ms       = require('ms');

const ACTION_NAME = 'verifyUserAccount';
const CODE_LENGTH = 5;

/**
 * Emailing stuff.
 * TODO: study whether this should be moved to a separate service
 */
const mustache = require('mustache');
const verifyAccountEmailTemplate = fs.readFileSync(path.join(__dirname, '../../email-templates/verify-account.html'), 'utf8');

module.exports = function (app, options) {

  const errors = app.errors;

  const User = app.models.User;

  const FROM_EMAIL = options.fromEmail;

  var accVerificationCtrl = {};

  /**
   * Creates a verification request
   * @param  {String} username
   * @return {Bluebird}
   */
  accVerificationCtrl.createRequest = function (username) {
    if (!username) {
      return Bluebird.reject(new errors.InvalidOption(
        'username',
        'required',
        'username is required for verification request'
      ));
    }

    var _user;

    // load user
    return app.controllers.user.getByUsername(username)
      .then((user) => {
        // save the user for later usage
        _user = user;

        return app.controllers.protectedRequest.create(user._id, ACTION_NAME, {
          expiresIn: '1d',
          codeLength: CODE_LENGTH,
        });
      })
      .then((confirmationCode) => {

        // setup e-mail data
        var mailOptions = {
          from: FROM_EMAIL,
          to: _user.get('email'),
          subject: 'Welcome to Habemus',
          html: mustache.render(verifyAccountEmailTemplate, {
            email: _user.get('email'),
            code: confirmationCode,
          }),
        };

        return new Bluebird((resolve, reject) => {
          app.services.nodemailer.sendMail(mailOptions, function (err, sentEmailInfo) {
            if (err) { reject(err); }

            // make sure to return nothing
            resolve();
          });
        });
      });
  };

  /**
   * Attempt to verify a user with a verificationCode
   * @param  {String} username
   * @param  {String} confirmationCode
   * @return {Bluebird}
   */
  accVerificationCtrl.verifyUserAccount = function (username, confirmationCode) {
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

    var _user;

    return app.controllers.user.getByUsername(username)
      .then((user) => {
        _user = user;

        return app.controllers.protectedRequest
          .verifyRequestConfirmationCode(user._id, ACTION_NAME, confirmationCode)
      })
      .then(() => {
        // successfully unlocked
        
        // change the user account status to active
        _user.setAccountActive('VerificationSuccess');

        return _user.save();
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

  return accVerificationCtrl;
};