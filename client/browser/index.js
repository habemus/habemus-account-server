// native
const util         = require('util');
const EventEmitter = require('events');

// third-party
const superagent = require('superagent');
const Bluebird   = require('bluebird');

// constants
const TRAILING_SLASH_RE = /\/$/;
const LOGGED_IN  = 'logged_in';
const LOGGED_OUT = 'logged_out';

const errors = require('../errors');
const aux    = require('../auxiliary');

/**
 * Auth client constructor
 * @param {Object} options
 */
function HAccountClient(options) {

  if (!options.serverURI) { throw new TypeError('serverURI is required'); }

  this.serverURI = options.serverURI.replace(TRAILING_SLASH_RE, '');

  this.localStoragePrefix = options.localStoragePrefix || 'h_account_';

  /**
   * Indicates the status of the current user.
   * @type {String}
   */
  this.status = undefined;

  /**
   * The cached user
   * @private
   */
  this._cachedUser = undefined;

  // check initial authentication status
  this.getCurrentUser();
}

util.inherits(HAccountClient, EventEmitter);

HAccountClient.prototype.constants = {
  LOGGED_IN: LOGGED_IN,
  LOGGED_OUT: LOGGED_OUT
};

// static properties
HAccountClient.errors = errors;

/**
 * Loads the auth token from the browser's localstorage
 * @return {String|Boolean}
 */
HAccountClient.prototype.getAuthToken = function () {
  var tokenStorageKey = this.localStoragePrefix + 'auth_token';

  return window.localStorage.getItem(tokenStorageKey) || false;
};
/**
 * Creates a new user account.
 * @param  {String} password   
 * @param  {String} password
 * @param  {String} email
 * @param  {Object} options
 *         - immediatelyLogIn
 * @return {Promise->userData}         
 */
HAccountClient.prototype.signUp = function (username, password, email, options) {
  if (!username) {
    return Bluebird.reject(new errors.InvalidOption(
      'username',
      'required',
      'username is required for signUp'
    ));
  }

  if (!password) {
    return Bluebird.reject(new errors.InvalidOption(
      'password',
      'required',
      'password is required for signUp'
    ));
  }

  if (!email) {
    return Bluebird.reject(new errors.InvalidOption(
      'email',
      'required',
      'email is required for signUp'
    ));
  }

  options = options || {};

  return new Bluebird(function (resolve, reject) {

    superagent
      .post(this.serverURI + '/users')
      .send({
        username: username,
        password: password,
        email: email,
      })
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
    
  }.bind(this))
  .then(function (user) {

    if (options.immediatelyLogIn) {
      return this.logIn(username, password)
        .then(function () {
          // ensure signup function returns the user
          return user;
        });
    } else {
      return user;
    }

  }.bind(this));
};

/**
 * Retrieves the current user data from the server
 * @param  {Object} options
 * @return {Promise->userData}        
 */
HAccountClient.prototype.getCurrentUser = function (options) {

  return new Bluebird(function (resolve, reject) {

    var token = this.getAuthToken();

    if (!token) {
      this._setAuthStatus(LOGGED_OUT);
      reject(new HAccountClient.errors.NotLoggedIn());
    } else {

      // check if there is a cached version of the userData
      if (this._cachedUser) {

        // resolve immediately
        resolve(this._cachedUser);

      } else {
        var tokenData = aux.decodeJWTPayload(token);

        superagent
          .get(this.serverURI + '/user/' + tokenData.username)
          .set({
            'Authorization': 'Bearer ' + token
          })
          .end(function (err, res) {
            if (err) {
              if (res.statusCode === 401 || res.statusCode === 403) {
                // token is invalid, destroy it
                this._destroyAuthToken();
                this._setAuthStatus(LOGGED_OUT);
              }

              reject(res.body.error);
              return;
            }

            this._cachedUser = res.body.data;
            this._setAuthStatus(LOGGED_IN);
            resolve(res.body.data);
          }.bind(this));
      }
    }

  }.bind(this));
};

/**
 * Logs user in
 * @param  {String} username
 * @param  {String} password
 * @return {Promise -> userData}         
 */
HAccountClient.prototype.logIn = function (username, password) {

  return new Bluebird(function (resolve, reject) {

    superagent
      .post(this.serverURI + '/auth/token/generate')
      .send({
        username: username,
        password: password
      })
      .end(function (err, res) {
        if (err) {
          reject(res.body.error);

          delete this._cachedUser;
          this._setAuthStatus(LOGGED_OUT);
          return;
        }

        var token = res.body.data.token;

        // save the token
        this._saveAuthToken(token);

        // decode the token and save the decoded data
        // as the _cachedUser
        var tokenData = aux.decodeJWTPayload(token);

        this._cachedUser = tokenData;
        // set authentication status
        this._setAuthStatus(LOGGED_OUT);

        // resolve with the response data
        resolve(res.body.data);
      }.bind(this));

  }.bind(this));

};

/**
 * Logs currently logged in user out.
 * @return {Promise}
 */
HAccountClient.prototype.logOut = function () {

  return new Bluebird(function (resolve, reject) {

    var token = this.getAuthToken();

    if (!token) {
      reject(new errors.NotLoggedIn('Already logged out'));
      return;
    }

    this._destroyAuthToken();
    delete this._cachedUser;

    superagent
      .post(this.serverURI + '/auth/token/revoke')
      .set('Authorization', 'Bearer ' + token)
      .end(function (err, res) {
        if (err) {
          reject(res.body.error);

          this._setAuthStatus(LOGGED_OUT);
          return;
        }

        resolve();
      }.bind(this));

  }.bind(this));

};

//////////////////
// PRIVATE METHODS

/**
 * Saves the token to the browser localstorage
 * @private
 * @param  {String} token
 */
HAccountClient.prototype._saveAuthToken = function (token) {
  var tokenStorageKey = this.localStoragePrefix + 'auth_token';

  window.localStorage.setItem(tokenStorageKey, token);
};

/**
 * Deletes the token from the browser's localstorage
 * @private
 */
HAccountClient.prototype._destroyAuthToken = function () {
  var tokenStorageKey = this.localStoragePrefix + 'auth_token';

  window.localStorage.removeItem(tokenStorageKey);
};

/**
 * Changes the authentication status and emits `auth-status-change` event
 * if the auth-status has effectively been changed by the new value setting.
 */
HAccountClient.prototype._setAuthStatus = function (status) {

  var hasChanged = (this.status !== status);

  this.status = status;

  if (hasChanged) {
    this.emit('auth-status-change', status);
  }
};

module.exports = HAccountClient;
