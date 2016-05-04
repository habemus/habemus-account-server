// third-party
const jwt  = require('jsonwebtoken');
const uuid = require('node-uuid');

const DEFAULT_TOKEN_EXPIRY = '1h';

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

    if (!username) { return Promise.reject(new app.Error('UsernameMissing')); }
    if (!password) { return Promise.reject(new app.Error('PasswordMissing')); }

    var _user;

    return Promise.resolve(User.findOne({ username: username }))
      .then((user) => {

        if (!user) {
          throw new app.Error('UsernameNotFound', username);
        }

        // store user in outside var for later usage
        _user = user;

        return _user.validatePassword(password);
      })
      .then((isValid) => {

        if (!isValid) {
          throw new app.Error('InvalidCredentials');
        }

        return new Promise((resolve, reject) => {

          var userData = {
            username: _user.username,
            createdAt: _user.createdAt,
            verifiedAt: _user.verifiedAt
          };

          var signOptions = {
            // algorithm: 'HS256',
            expiresIn: TOKEN_EXPIRY,
            // notBefore: ,
            // audience: ,
            issuer: 'h-auth',
            jwtid: uuid.v4(),
            // subject: ,
          };

          jwt.sign(userData, SECRET, signOptions, resolve);
        });
      });
  };

  /**
   * Verifies if the token is valid and decodes its contents.
   * @param  {JWT} token [description]
   * @return {Object}       [description]
   */
  authCtrl.decodeToken = function (token) {

    if (!token) { return Promise.reject(new app.Error('TokenMissing')); }

    return new Promise((resolve, reject) => {
      // verifies secret and checks exp
      jwt.verify(token, SECRET, (err, decoded) => {      
        if (err) {
          reject(new app.Error('InvalidToken'));
        } else {

          // check if the token has been revoked
          TokenRevocationEntry.findOne({
            tokenId: decoded.jti,
          })
          .then((err, revocationEntry) => {
            if (err) {
              reject(new app.Error('InternalServerError'));
            } else if (revocationEntry) {
              reject(new app.Error('InvalidToken'));
            } else {
              resolve(decoded);
            }
          });
        }
      });
    });
    
  };

  authCtrl.revokeToken = function (jwtid) {

    if (typeof jwtid !== 'string') { return Promise.reject(new TypeError('jwtid must be a string')); }

    var revocationEntry = new TokenRevocationEntry({
      tokenId: jwtid,
    });

    return revocationEntry.save();
  };

  return authCtrl;

};