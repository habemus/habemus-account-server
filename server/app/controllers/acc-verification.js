// native dependencies
const fs = require('fs');
const path = require('path');

// third-party
const Bluebird = require('bluebird');
const uuid     = require('node-uuid');
const ms       = require('ms');

const ACTION_NAME = 'verifyUserAccount';

/**
 * Emailing stuff.
 * TODO: study whether this should be moved to a separate service
 */
const mustache = require('mustache');
const verifyAccountEmailTemplate = fs.readFileSync(path.join(__dirname, '../../email-templates/verify-account.html'), 'utf8');

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

  var accVerificationCtrl = {};

  /**
   * Creates a verification request
   * @param  {String} userId
   * @return {Bluebird}
   */
  accVerificationCtrl.createRequest = function (userId) {
    var _user;

    // load user
    return app.controllers.user.getById(userId)
      .then((user) => {
        // save the user for later usage
        _user = user;

        return app.controllers.protectedRequest.create(userId, ACTION_NAME, {
          expiresIn: '1d',
          codeLength: 7,
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

            resolve(sentEmailInfo);
          });
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  /**
   * Attempt to verify a user with a verificationCode
   * @param  {String} userId
   * @param  {String} confirmationCode
   * @return {Bluebird}
   */
  accVerificationCtrl[ACTION_NAME] = function (userId, confirmationCode) {

    return app.controllers.protectedRequest
      .verifyRequestConfirmationCode(userId, ACTION_NAME, confirmationCode)
      .then(() => {
        // successfully unlocked
        
        // load the user
        return app.controllers.user.getById(userId);
      })
      .then((user) => {
        // change the user account status to active
        user.setAccountActive('VerificationSuccess');

        return user.save();
      })
      .catch((err) => {

        // default behavior is to reject with the original error
        return Bluebird.reject(err);
      });
  };

  return accVerificationCtrl;
};