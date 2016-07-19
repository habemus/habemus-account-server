// native
const util = require('util');

/**
 * Base message constructor
 * @param {String} message
 */
function HAuthError(message) {
  Error.call(this);

  this.message = message;
};
HAuthError.prototype.name = 'HAuthError';
exports.HAuthError = HAuthError;

/**
 * Happens when any required option is invalid
 *
 * error.option should have the option that is invalid
 * error.kind should contain details on the error type
 * 
 * @param {String} option
 * @param {String} kind
 * @param {String} message
 */
function InvalidOption(option, kind, message) {
  HAuthError.call(this, message);

  this.option = option;
  this.kind = kind;
}
util.inherits(InvalidOption, HAuthError);
InvalidOption.prototype.name = 'InvalidOption';
exports.InvalidOption = InvalidOption;

/**
 * Happens whenever the attempted username
 * is already in use by another account.
 * 
 * @param {String} username
 */
function UsernameTaken(username) {
  HAuthError.call(this, 'Username ' + username + ' is already taken');

  this.username = username;
}
util.inherits(UsernameTaken, HAuthError);
UsernameTaken.prototype.name = 'UsernameTaken';
exports.UsernameTaken = UsernameTaken;

/**
 * Happens whenever the attempted email
 * is already in use by another account.
 * 
 * @param {String} email
 */
function EmailTaken(email) {
  HAuthError.call(this, 'Username ' + email + ' is already taken');

  this.email = email;
}
util.inherits(EmailTaken, HAuthError);
EmailTaken.prototype.name = 'EmailTaken';
exports.EmailTaken = EmailTaken;

/**
 * Happens whenever the credentials provided are not valid
 */
function InvalidCredentials(detail) {
  HAuthError.call(this, 'The credentials provided are invalid');

  this.detail = detail;
}
util.inherits(InvalidCredentials, HAuthError);
InvalidCredentials.prototype.name = 'InvalidCredentials';
exports.InvalidCredentials = InvalidCredentials;

/**
 * Happens whenever an action requested is not authorized
 * by the server
 * @param {String} message [description]
 */
function Unauthorized(message) {
  HAuthError.call(this, message);
}
util.inherits(Unauthorized, HAuthError);
Unauthorized.prototype.name = 'Unauthorized';
exports.Unauthorized = Unauthorized;

/**
 * Happens whenever the token provided for auth is invalid
 */
function InvalidToken() {
  HAuthError.call(this, 'Token provided is invalid');
}
util.inherits(InvalidToken, HAuthError);
InvalidToken.prototype.name = 'InvalidToken';
exports.InvalidToken = InvalidToken;

/**
 * Happens whenever the user is not found
 * for the given identification (username or identifier)
 * @param {String} identifier (username or identifier)
 * @param {String} message
 */
function UserNotFound(identifier, message) {
  HAuthError.call(this, message);

  this.identifier = identifier;
}
util.inherits(UserNotFound, HAuthError);
UserNotFound.prototype.name = 'UserNotFound';
exports.UserNotFound = UserNotFound;
