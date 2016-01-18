'use strict';

// native
var util = require('util');
var EventEmitter = require('events').EventEmitter;

// third-party
var Q = require('q');

// CONSTANTS
var AUTH_STATUS_CHANGE_EVENT = 'auth-status-change';

var retrieveErrorName = require('./lib/parse-com-errors');

// auxiliary functions
function _emitAuthChange(authInstance) {
  authInstance.emit(AUTH_STATUS_CHANGE_EVENT, {
    target: authInstance,
    authenticated: authInstance.isAuthenticated(),
  });
} 

/**
 * The constructor.
 * Currently using Parse, but our intentions are to migrate this
 * module to be a standalone authentication server.
 *
 * Is an EventEmitter
 * @param {Object} options
 */
function AuthServiceClient(options) {

  // internal reference to parse
  this._parse = options.parse;
}

util.inherits(AuthServiceClient, EventEmitter);

/**
 * Creates an user
 * @param  {String} username [description]
 * @param  {String} password [description]
 * @param  {Object} userData [description]
 * @return {Promise}          [description]
 */
AuthServiceClient.prototype.signUp = function (username, password, userData) {

  var user = new this._parse.User(userData);

  user.set('username', username);
  user.set('password', password);

  var signupPromise = user.signUp();

  signupPromise.then(_emitAuthChange.bind(null, this));

  return signupPromise;
};

/**
 * Retrieves the current user
 * @type {[type]}
 */
AuthServiceClient.prototype.getCurrentUser = function () {
  return this._parse.User.current();
};

/**
 * Logs an user in
 * @param  {String} username [description]
 * @param  {String} password [description]
 * @return {Promise}          [description]
 */
AuthServiceClient.prototype.logIn = function (username, password) {
  var logInPromise = this._parse.User.logIn(username, password);

  logInPromise.then(_emitAuthChange.bind(null, this));


  return Q(logInPromise);
};

/**
 * Logs the current user out.
 * @return {Promise} [description]
 */
AuthServiceClient.prototype.logOut = function () {
  var logOutPromise = this._parse.User.logOut();

  // handle both success and failure cases the same way,
  // as the main purpose of the logout is to delete the localstorage
  // session data
  logOutPromise.then(
    _emitAuthChange.bind(null, this),
    _emitAuthChange.bind(null, this)
  );

  return Q(logOutPromise);
};

AuthServiceClient.prototype.updateCurrentUserData = function (userData) {
  if (!userData) { throw new Error('userData is required'); }
  if (userData.password) { throw new Error('userData.password should be set via changePassword'); }
  if (userData.username) { throw new Error('userData.username cannot be changed'); }
  if (userData.email) { throw new Error('userData.email cannot be changed'); }

  var user = this.getCurrentUser();

  user.set(userData);

  return Q(user.save()).then(function (u) {
    return u.toJSON();
  });
};

AuthServiceClient.prototype.changePassword = function (password) {

  var user = this.getCurrentUser();

  user.setPassword(password);

  return Q(user.save());
};

AuthServiceClient.prototype.handleSessionReset = function (err) {

  console.log('handleSessionReset');

  return this.logOut()
    .then(function () {

    }, function () {

    });
};

/**
 * Checks whether the user is authorized to perform
 * a given operation
 *
 * Currently returning true if the user is logged.
 * In the future, when multiple roles and permissions are required
 * we'll implement this.
 * 
 * @param {String|OperationObject} operation [description]
 * @return {Boolean} [description]
 */
AuthServiceClient.prototype.isAuthorized = function (operation) {
  // TODO: logic
  return this.getCurrentUser() ? true : false;
};

/**
 * Checks whether the user is authenticated
 * @return {Boolean} [description]
 */
AuthServiceClient.prototype.isAuthenticated = function () {
  return this.getCurrentUser() ? true : false;
};

module.exports = AuthServiceClient;
