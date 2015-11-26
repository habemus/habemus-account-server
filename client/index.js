'use strict';

// native
var util = require('util');
var EventEmitter = require('events').EventEmitter;

// CONSTANTS
var AUTH_STATUS_CHANGE_EVENT = 'auth-status-change';

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


  return logInPromise;
};

/**
 * Logs the current user out.
 * @return {Promise} [description]
 */
AuthServiceClient.prototype.logOut = function () {
  var logOutPromise = this._parse.User.logOut();

  logOutPromise.then(_emitAuthChange.bind(null, this));

  return logOutPromise;
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
