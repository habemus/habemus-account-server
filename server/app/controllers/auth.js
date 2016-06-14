// third-party
const jwt  = require('jsonwebtoken');
const uuid = require('node-uuid');
const Bluebird = require('bluebird');

const hToken = require('h-token');
const hLock  = require('h-lock');

const DEFAULT_TOKEN_EXPIRY = '1h';

const ATTEMPTER_ID = 'h-auth-attempter';

module.exports = function (app, options) {
  
  const TOKEN_EXPIRY         = options.tokenExpiry || DEFAULT_TOKEN_EXPIRY;
  const SECRET               = options.secret;
  const User                 = app.models.User;
  const TokenRevocationEntry = app.models.TokenRevocationEntry;

  var authCtrl = {};

  /**
   * Generates an authentication token for the given credentials
   * @param  {String} username The username (public part of the account)
   * @param  {String} password The password in plain text (private part of the account)
   * @return {JWT}             A JSON Web Token
   */
  authCtrl.generateToken = function (username, password, options) {

    if (!username) { return Bluebird.reject(new app.Error('UsernameMissing')); }
    if (!password) { return Bluebird.reject(new app.Error('PasswordMissing')); }

    var _user;

    return Bluebird.resolve(User.findOne({ username: username }))
      .then((user) => {

        if (!user) {
          throw new app.Error('UsernameNotFound', username);
        }

        // store user in outside var for later usage
        _user = user;

        // get the _accLockId
        var _accLockId = _user.get('_accLockId');

        return app.services.accountLock.unlock(_accLockId, password, ATTEMPTER_ID);

        // return _user.validatePassword(password);
      })
      .then(() => {

        var userData = {            
          createdAt: _user.createdAt,
          verifiedAt: _user.verifiedAt
        };

        return app.services.token.generate(userData, {
          expiresIn: TOKEN_EXPIRY,
          subject: _user._id.toString(),
        });
      })
      .catch((err) => {
        if (err instanceof hLock.errors.InvalidSecret) {
          return Bluebird.reject(new app.Error('InvalidCredentials'));
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
    if (!token) { return Bluebird.reject(new app.Error('TokenMissing')); }

    return app.services.token.verify(token)
      .then((decoded) => {

        return decoded;

      }, (err) => {
        if (err instanceof hToken.errors.InvalidTokenError) {
          return Bluebird.reject(new app.Error('InvalidToken'));
        } else {
          return Bluebird.reject(new app.Error('InternalServerError'));
        }
      });
  };

  authCtrl.revokeToken = function (tokenId) {
    return app.services.token.revoke(tokenId);
  };

  return authCtrl;

};