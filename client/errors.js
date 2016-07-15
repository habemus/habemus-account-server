const util = require('util');

var errors = require('../shared/errors');

const HAuthError = errors.HAuthError;

/**
 * Client errors
 */

/**
 * Happens whenever the user is not logged in
 * @param {String} message
 */
function NotLoggedIn(message) {
  HAuthError.call(this, message);
}
util.inherits(NotLoggedIn, HAuthError);
NotLoggedIn.prototype.name = 'NotLoggedIn';
exports.NotLoggedIn = NotLoggedIn;

/**
 * Happens whenever the user has cancelled any action.
 * @param {String} message
 */
function UserCancelled(message) {
  HAuthError.call(this, message);
}
util.inherits(UserCancelled, HAuthError);
UserCancelled.prototype.name = 'UserCancelled';
exports.UserCancelled = UserCancelled;