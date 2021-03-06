// third-party
const Bluebird = require('bluebird');

const mongooseToken = require('@habemus/mongoose-token');
const mongooseLock  = require('@habemus/mongoose-lock');

const ATTEMPTER_ID = 'h-auth-attempter';

module.exports = function (app, options) {

  const errors = app.errors;

  const User = app.services.mongoose.models.User;

  var authCtrl = {};

  /**
   * Generates an authentication token for the given credentials
   * @param  {String} usernameOrEmail The usernameOrEmail (public part of the account)
   * @param  {String} password The password in plain text (private part of the account)
   * @return {JWT}             A JSON Web Token
   */
  authCtrl.generateToken = function (usernameOrEmail, password) {

    if (!usernameOrEmail) {
      return Bluebird.reject(new errors.InvalidOption(
        'usernameOrEmail',
        'required',
        'usernameOrEmail is required for generating a token'
      ));
    }
    if (!password) {
      return Bluebird.reject(new errors.InvalidOption(
        'password',
        'required',
        'password is required for generating token'
      ));
    }

    var _user;

    return app.controllers.account.getByUsernameOrEmail(usernameOrEmail)
      .then((user) => {
        // store user in outside var for later usage
        _user = user;

        // get the _accLockId
        var _accLockId = _user.get('_accLockId');

        return app.services.accountLock.unlock(_accLockId, password, ATTEMPTER_ID);
      })
      .then(() => {

        var userData = {
          createdAt: _user.createdAt,
          username: _user.username,
        };

        return app.services.accountToken.generate(userData, {
          subject: _user._id,
        });
      })
      .catch((err) => {
        if (err instanceof mongooseLock.errors.InvalidSecret) {
          return Bluebird.reject(new errors.InvalidCredentials());
        }

        // omit 'UserNotFound' errors and return InvalidCredentials instead
        if (err instanceof errors.UserNotFound) {
          return Bluebird.reject(new errors.InvalidCredentials());
        }

        // always reject
        return Bluebird.reject(err);
      });
  };

  /**
   * Verifies if the token is valid and decodes its contents.
   * @param  {JWT} token [description]
   * @return {Object}       [description]
   */
  authCtrl.decodeToken = function (token) {
    if (!token) {
      return Bluebird.reject(new errors.InvalidOption('token', 'required'));
    }

    return app.services.accountToken.verify(token)
      .then((decoded) => {

        return decoded;

      }, (err) => {
        if (err instanceof mongooseToken.errors.InvalidTokenError) {
          // TODO: inform client of reason for invalid token
          return Bluebird.reject(new errors.InvalidToken());
        }

        // by default reject the err
        return Bluebird.reject(err);
      });
  };

  authCtrl.revokeToken = function (tokenId) {
    if (!tokenId) {
      return Bluebird.reject(new errors.InvalidOption(
        'tokenId',
        'required',
        'tokenId is required'
      ));
    }

    return app.services.accountToken.revoke(tokenId);
  };

  return authCtrl;

};