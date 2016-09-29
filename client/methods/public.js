// third-party
const Bluebird   = require('bluebird');
const superagent = require('superagent');

const errors = require('../errors');

/**
 * Creates a new account
 * 
 * @param  {Object} accountData
 *         - email
 *         - username
 *         - password
 * @return {Bluebird -> AccountData}
 */
exports.createAccount = function (accountData) {
  if (!accountData) {
    return Bluebird.reject(new errors.InvalidOption('accountData', 'required'));
  }

  if (!accountData.username) {
    return Bluebird.reject(new errors.InvalidOption('username', 'required'));
  }

  if (!accountData.email) {
    return Bluebird.reject(new errors.InvalidOption('email', 'required'));
  }

  if (!accountData.password) {
    return Bluebird.reject(new errors.InvalidOption('password', 'required'));
  }

  return new Bluebird(function (resolve, reject) {

    superagent
      .post(this.serverURI + '/accounts')
      .send(accountData)
      .end(function (err, res) {
        if (err) {
          if (res && res.body && res.body.error) {
            reject(res.body.error);
          } else {
            reject(err);
          }
          return;
        }

        resolve(res.body.data);
      });
    
  }.bind(this));
};

/**
 * Retrieves an account by its username
 * 
 * @param  {String} authToken
 * @param  {String} username
 * @return {Bluebird -> AccountData}
 */
exports.getAccount = function (authToken, username) {

  if (!authToken) {
    return Bluebird.reject(new errors.InvalidOption('authToken', 'required'));
  }

  if (!username) {
    return Bluebird.reject(new errors.InvalidOption('username', 'required'));
  }

  return new Bluebird(function (resolve, reject) {

    superagent
      .get(this.serverURI + '/account/' + username)
      .set({
        'Authorization': 'Bearer ' + authToken
      })
      .end(function (err, res) {
        if (err) {
          if (res && res.statusCode === 401) {

            // invalid token
            reject(new errors.InvalidToken(authToken));

          } else if (res && res.statusCode === 403) {

            // unauthorized
            reject(new errors.Unauthorized());

          } else if (res && res.statusCode === 404) {

            // not found
            reject(new errors.UserNotFound());

          } else {
            // unknown error
            reject(err);
          }

          return;
        }

        resolve(res.body.data);

      }.bind(this));

  }.bind(this));
};

/**
 * Generates an auth token for the account idenfied by combination
 * of username and password
 * 
 * @param  {String} username
 * @param  {String} password
 * @return {Bluebird -> Token}
 */
exports.generateToken = function (username, password) {

  if (!username) {
    return Bluebird.reject(new errors.InvalidOption('username', 'required'));
  }

  if (!password) {
    return Bluebird.reject(new errors.InvalidOption('password', 'required'));
  }

  return new Bluebird(function (resolve, reject) {

    superagent
      .post(this.serverURI + '/auth/token/generate')
      .send({
        username: username,
        password: password
      })
      .end(function (err, res) {
        if (err) {

          if (res && res.body && res.body.error) {
            reject(res.body.error);
          } else {
            // unknown error
            reject(err);
          }

          return;
        }

        resolve(res.body.data.token);

      }.bind(this));

  }.bind(this));
};

/**
 * Revokes the given token.
 * Uses the token itself as authorization token.
 * 
 * @param  {String} token
 */
exports.revokeToken = function (token) {

  if (!token) {
    return Bluebird.reject(new errors.InvalidOption('token', 'required'));
  }

  return new Bluebird(function (resolve, reject) {

    superagent
      .post(this.serverURI + '/auth/token/revoke')
      .set('Authorization', 'Bearer ' + token)
      .end(function (err, res) {
        if (err) {

          if (res && res.body && res.body.error) {
            reject(res.body.error);
          } else {
            // unknown error
            reject(err);
          }

          return;
        }

        resolve();
      }.bind(this));

    }.bind(this));

};

/**
 * Asks the server to resend the email verification email.
 * 
 * @param  {String} authToken
 * @param  {String} username
 * @return {Bluebird -> undefined}
 */
exports.requestEmailVerification = function (authToken, username) {

  if (!authToken) {
    return Bluebird.reject(new errors.InvalidOption('authToken', 'required'));
  }

  if (!username) {
    return Bluebird.reject(new errors.InvalidOption('username', 'required'));
  }

  return new Bluebird(function (resolve, reject) {

    superagent
      .post(this.serverURI + '/account/' + username + '/request-email-verification')
      .set({
        'Authorization': 'Bearer ' + authToken
      })
      .end(function (err, res) {
        if (err) {
          if (res && res.statusCode === 401) {

            // invalid token
            reject(new errors.InvalidToken(authToken));

          } else if (res && res.statusCode === 403) {

            // unauthorized
            reject(new errors.Unauthorized());

          } else {

            // unknown error
            reject(err);
          }

          return;
        }

        resolve();

      }.bind(this));

  }.bind(this));
};

/**
 * Requests a password reset.
 * This is the first step in the workflow of resetting an
 * account's password
 * 
 * @param  {String} email
 * @return {Bluebird -> undefined}
 */
exports.requestPasswordReset = function (email) {

  return new Bluebird(function (resolve, reject) {

    superagent
      .post(this.serverURI + '/request-password-reset')
      .send({
        email: email,
      })
      .end(function (err, res) {
        if (err) {
          if (res && res.body && res.body.error) {
            reject(res.body.error);
          } else {
            // unknown error
            reject(err);
          }

          return;
        }

        resolve();
      });

  }.bind(this));

};
