// third-party
const jwt = require('jsonwebtoken');

const DEFAULT_TOKEN_EXPIRY = '1h';

module.exports = function (app, options) {
  
  const TOKEN_EXPIRY = options.tokenExpiry || DEFAULT_TOKEN_EXPIRY;
  const SECRET = options.secret;
  const User   = app.models.User;

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
            createdAt: _user.createdAt
          };

          jwt.sign(userData, SECRET, { expiresIn: TOKEN_EXPIRY }, resolve);
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
          resolve(decoded);
        }
      });
    });
    
  };

  return authCtrl;

};