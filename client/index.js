// native
const util         = require('util');
const EventEmitter = require('events');

// third-party
const superagent = require('superagent');
const Q          = require('q');
const jwt        = require('jsonwebtoken');

// constants
const TRAILING_SLASH_RE = /\/$/;
const LOGGED_IN  = 'logged_in';
const LOGGED_OUT = 'logged_out';

const errors = require('./errors');

/**
 * Auth client constructor
 * @param {Object} options
 */
function AuthClient(options) {

  if (!options.serverURI) { throw new TypeError('serverURI is required'); }

  this.serverURI = TRAILING_SLASH_RE.test(options.serverURI) ?
    options.serverURI : options.serverURI + '/';

  this.localStoragePrefix = options.localStoragePrefix || 'h_auth_';

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

util.inherits(AuthClient, EventEmitter);

AuthClient.prototype.constants = {
  LOGGED_IN: LOGGED_IN,
  LOGGED_OUT: LOGGED_OUT
};

// static properties
AuthClient.errors = errors;

const privateMethods = require('./methods/private');

for (var m in privateMethods) {
  AuthClient.prototype[m] = privateMethods[m];
}

/**
 * Loads the auth token from the browser's localstorage
 * @return {String|Boolean}
 */
AuthClient.prototype.getAuthToken = function () {
  var tokenStorageKey = this.localStoragePrefix + 'auth_token';

  return window.localStorage.getItem(tokenStorageKey) || false;
};
/**
 * Creates a new user account.
 * @param  {String} password   
 * @param  {String} password
 * @param  {String} email
 * @return {Promise->userData}         
 */
AuthClient.prototype.signUp = function (username, password, email) {
  if (!username) {
    return Q.reject(new errors.InvalidOption(
      'username',
      'required',
      'username is required for signUp'
    ));
  }

  if (!password) {
    return Q.reject(new errors.InvalidOption(
      'password',
      'required',
      'password is required for signUp'
    ));
  }

  if (!email) {
    return Q.reject(new errors.InvalidOption(
      'email',
      'required',
      'email is required for signUp'
    ));
  }

  var defer = Q.defer();

  superagent
    .post(this.serverURI + 'users')
    .send({
      username: username,
      password: password,
      email: email,
    })
    .end(function (err, res) {
      if (err) {
        if (res && res.body && res.body.error) {
          defer.reject(res.body.error);
        } else {
          defer.reject(err);
        }
        return;
      }

      defer.resolve(res.body.data);
    });

  return defer.promise;
};

/**
 * Retrieves the current user data from the server
 * @param  {Object} options
 * @return {Promise->userData}        
 */
AuthClient.prototype.getCurrentUser = function (options) {
  var defer = Q.defer();

  var token = this.getAuthToken();

  if (!token) {
    this._setAuthStatus(LOGGED_OUT);
    defer.reject(new AuthClient.errors.NotLoggedIn());
  } else {

    // check if there is a cached version of the userData
    if (this._cachedUser) {
      // resolve immediately
      defer.resolve(this._cachedUser);

    } else {
      var tokenData = jwt.decode(token);

      superagent
        .get(this.serverURI + 'user/' + tokenData.sub)
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

            defer.reject(res.body.error);
            return;
          }

          this._cachedUser = res.body.data;
          this._setAuthStatus(LOGGED_IN);
          defer.resolve(res.body.data);
        }.bind(this));
    }
  }

  return defer.promise;
};

/**
 * Logs user in
 * @param  {String} username
 * @param  {String} password
 * @return {Promise -> userData}         
 */
AuthClient.prototype.logIn = function (username, password) {
  var defer = Q.defer();

  superagent
    .post(this.serverURI + 'auth/token/generate')
    .send({
      username: username,
      password: password
    })
    .end(function (err, res) {
      if (err) {
        defer.reject(res.body.error);

        delete this._cachedUser;
        this._setAuthStatus(LOGGED_OUT);
        return;
      }

      // save the token
      this._saveAuthToken(res.body.data.token);

      this._cachedUser = res.body.data;
      // set authentication status
      this._setAuthStatus(LOGGED_OUT);
      defer.resolve(res.body.data);
    }.bind(this));

  return defer.promise;
};

/**
 * Logs currently logged in user out.
 * @return {Promise}
 */
AuthClient.prototype.logOut = function () {
  var defer = Q.defer();

  // TODO: implement logout on server

  this._destroyAuthToken();
  delete this._cachedUser;

  defer.resolve();

  return defer.promise.then(function () {
    this._setAuthStatus(LOGGED_OUT);

  }.bind(this));
};

module.exports = AuthClient;