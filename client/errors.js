const util = require('util');

var errors = require('../shared/errors');

const HAccountError = errors.HAccountError;

/**
 * Client errors
 */

/**
 * Happens whenever the user is not logged in
 * @param {String} message
 */
function NotLoggedIn(message) {
  HAccountError.call(this, message);
}
util.inherits(NotLoggedIn, HAccountError);
NotLoggedIn.prototype.name = 'NotLoggedIn';
exports.NotLoggedIn = NotLoggedIn;

/**
 * Happens whenever the user has cancelled any action.
 * @param {String} message
 */
function UserCancelled(message) {
  HAccountError.call(this, message);
}
util.inherits(UserCancelled, HAccountError);
UserCancelled.prototype.name = 'UserCancelled';
exports.UserCancelled = UserCancelled;

Object.assign(exports, errors);
