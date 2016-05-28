// native
const util         = require('util');
const EventEmitter = require('events');

// third-party
const superagent = require('superagent');
const Q          = require('q');
const jwt        = require('jsonwebtoken');

// constants
const TRAILING_SLASH_RE = /\/$/;
const STATUS_LOGGED_IN  = 'logged_in';
const STATUS_LOGGED_OUT = 'logged_out';

function AuthClient(options) {

  if (!options.serverURI) { throw new TypeError('serverURI is required'); }

  this.serverURI = TRAILING_SLASH_RE.test(options.serverURI) ?
    options.serverURI : options.serverURI + '/';

  this.localStoragePrefix = options.localStoragePrefix || 'auth_';

  /**
   * Indicates the status of the current user.
   * @type {String}
   */
  this.status = undefined;

  // check initial authentication status
  this.getCurrentUser();
}

util.inherits(AuthClient, EventEmitter);

// auxiliary methods
AuthClient.prototype._loadAuthToken = function () {
  var tokenStorageKey = this.localStoragePrefix + 'auth_token';

  return window.localStorage.getItem(tokenStorageKey) || false;
};

AuthClient.prototype._saveAuthToken = function (token) {
  var tokenStorageKey = this.localStoragePrefix + 'auth_token';

  window.localStorage.setItem(tokenStorageKey, token);
};

AuthClient.prototype._destroyAuthToken = function () {
  var tokenStorageKey = this.localStoragePrefix + 'auth_token';

  window.localStorage.removeItem(tokenStorageKey);
};

AuthClient.prototype.setAuthStatus = function (status) {

  var hasChanged = (this.status !== status);

  this.status = status;

  if (hasChanged) {
    this.emit('auth-status-change');
  }
};

AuthClient.prototype.signUp = function (email, password, userData) {
  var defer = Q.defer();

  if (!email) {

    defer.reject({
      code: 'ValidationError',
      path: 'email',
      kind: 'required',
      value: email,
    });

  } else if (!password) {

    defer.reject({
      code: 'ValidationError',
      path: 'password',
      kind: 'required',
      value: password,
    });

  } else {
    superagent
      .post(this.serverURI + 'users')
      .send({
        username: email,
        password: password,
        email: email,
      })
      .end(function (err, res) {
        if (err) {
          defer.reject(res.body.error);
          return;
        }

        defer.resolve(res.body.data);
      });
  }

  return defer.promise;
};

AuthClient.prototype.getCurrentUser = function (options) {
  var defer = Q.defer();

  var token = this._loadAuthToken();

  if (!token) {
    defer.reject(new Error('Not logged in'));
    this.setAuthStatus(STATUS_LOGGED_OUT);
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
            this.setAuthStatus(STATUS_LOGGED_OUT);
          }

          defer.reject(res.body.error);
          return;
        }

        this.setAuthStatus(STATUS_LOGGED_IN);
        defer.resolve(res.body.data);
      }.bind(this));
  }

  return defer.promise;
};

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

        this.setAuthStatus(STATUS_LOGGED_OUT);
        return;
      }

      // save the token
      this._saveAuthToken(res.body.data.token);

      defer.resolve(res.body.data);

      // set authentication status
      this.setAuthStatus(STATUS_LOGGED_IN);
    }.bind(this));

  return defer.promise;
};

AuthClient.prototype.logOut = function () {
  var defer = Q.defer();

  this._destroyAuthToken();

  defer.resolve();

  return defer.promise.then(function () {

    this.setAuthStatus(STATUS_LOGGED_OUT);

  }.bind(this));
};

module.exports = AuthClient;