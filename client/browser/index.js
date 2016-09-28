// native
const util         = require('util');
const EventEmitter = require('events');

// third-party
const Bluebird       = require('bluebird');
const cachePromiseFn = require('cache-promise-fn');

// constants
const LOGGED_IN  = 'logged_in';
const LOGGED_OUT = 'logged_out';

const errors = require('../errors');

/**
 * The public core client
 * @type {Function}
 */
const HAccountClient = require('../index');

/**
 * Light version that only decodes the token's Payload
 * @param  {String|JWT} token
 * @return {Object}
 */
function _decodeJWTPayload(token) {

  var payload = token.split('.')[1];

  if (!payload) {
    throw new errors.InvalidToken(token);
  }

  return JSON.parse(atob(payload));
};

/**
 * Auth client constructor
 * @param {Object} options
 */
function HAccountBrowserClient(options) {

  if (!options.serverURI) { throw new TypeError('serverURI is required'); }

  /**
   * Client core defines all API communication methods.
   * 
   * @type {HAccountClient}
   */
  this.core = new HAccountClient(options);

  /**
   * Prefix for storing data on localStorage
   * 
   * @type {String}
   */
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

  /**
   * Make calls to `getCurrentUser` cached
   */
  this.getCurrentUser = cachePromiseFn(this.getCurrentUser.bind(this), {
    cacheKey: function cacheKey() {
      // constant cache key, at this method takes no arguments
      return 'constant';
    }
  });
}
util.inherits(HAccountBrowserClient, EventEmitter);

HAccountBrowserClient.prototype.constants = {
  LOGGED_IN: LOGGED_IN,
  LOGGED_OUT: LOGGED_OUT
};

// static properties
HAccountBrowserClient.errors = errors;

/**
 * Loads the auth token from the browser's localstorage
 * @return {String|Boolean}
 */
HAccountBrowserClient.prototype.getAuthToken = function () {
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
HAccountBrowserClient.prototype.signUp = function (username, password, email, options) {
  options = options || {};

  return this.core.createAccount({
    username: username,
    email: email,
    password: password,
  })
  .then(function (accountData) {

    if (options.immediatelyLogIn) {
      return this.logIn(username, password)
        .then(function () {
          // ensure signup function returns the accountData
          return accountData;
        });
    } else {
      return accountData;
    }

  }.bind(this));
};

/**
 * Retrieves the current user data from the server
 * 
 * @return {Promise->userData}        
 */
HAccountBrowserClient.prototype.getCurrentUser = function () {

  return new Bluebird(function (resolve, reject) {

    var token = this.getAuthToken();

    if (!token) {

      this._setAuthStatus(LOGGED_OUT);
      reject(new errors.NotLoggedIn());
    } else {

      // check if there is a cached version of the userData
      if (this._cachedUser) {

        // resolve immediately
        resolve(this._cachedUser);

      } else {
        var tokenData = _decodeJWTPayload(token);
        var username  = tokenData.username;

        this.core.getAccount(token, username)
          .then(function (accountData) {

            this._cachedUser = accountData;
            this._setAuthStatus(LOGGED_IN);

            resolve(accountData);

          }.bind(this));
      }
    }

  }.bind(this))
  .catch(function (err) {

    if (err.name === 'InvalidToken' || err.name === 'Unauthorized') {
      // token is invalid, destroy it
      this._destroyAuthToken();
      this._setAuthStatus(LOGGED_OUT);

      return Bluebird.reject(new errors.NotLoggedIn())
    }

    return Bluebird.reject(err);

  }.bind(this));
};

/**
 * Logs user in
 * @param  {String} username
 * @param  {String} password
 * @return {Promise -> userData}         
 */
HAccountBrowserClient.prototype.logIn = function (username, password) {

  return this.core.generateToken(username, password)
    .then(function (token) {
      // save the token
      this._saveAuthToken(token);

      // decode the token and save the decoded data
      // as the _cachedUser
      var tokenData = _decodeJWTPayload(token);

      this._cachedUser = tokenData;
      // set authentication status
      this._setAuthStatus(LOGGED_IN);

      return tokenData;

    }.bind(this))
    .catch(function (err) {

      delete this._cachedUser;
      this._setAuthStatus(LOGGED_OUT);

      return Bluebird.reject(err);

    }.bind(this));
};

/**
 * Logs currently logged in user out.
 * @return {Promise}
 */
HAccountBrowserClient.prototype.logOut = function () {

  return new Bluebird(function (resolve, reject) {

    var token = this.getAuthToken();

    if (!token) {
      reject(new errors.NotLoggedIn('Already logged out'));
      return;
    }

    this._destroyAuthToken();
    delete this._cachedUser;

    this.core.revokeToken(token)
      .then(function () {

        this._setAuthStatus(LOGGED_OUT);
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
HAccountBrowserClient.prototype._saveAuthToken = function (token) {
  var tokenStorageKey = this.localStoragePrefix + 'auth_token';

  window.localStorage.setItem(tokenStorageKey, token);
};

/**
 * Deletes the token from the browser's localstorage
 * @private
 */
HAccountBrowserClient.prototype._destroyAuthToken = function () {
  var tokenStorageKey = this.localStoragePrefix + 'auth_token';

  window.localStorage.removeItem(tokenStorageKey);
};

/**
 * Changes the authentication status and emits `auth-status-change` event
 * if the auth-status has effectively been changed by the new value setting.
 */
HAccountBrowserClient.prototype._setAuthStatus = function (status) {

  var hasChanged = (this.status !== status);

  this.status = status;

  if (hasChanged) {
    this.emit('auth-status-change', status);
  }
};

module.exports = HAccountBrowserClient;
