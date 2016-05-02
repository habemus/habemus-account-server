// native
var util = require('util');

function echo(arg) {
  return arg;
}

function invalidCredentials(arg) {
  return 'Invalid credentials';
}

const ERRORS = {
  UsernameMissing: echo,
  PasswordMissing: echo,
  UsernameTaken: function (username) {
    return `The username ${username} is already taken.`; 
  },
  InvalidCredentials: invalidCredentials,
  InvalidToken: echo,
  UsernameNotFound: invalidCredentials,
  Unauthorized: invalidCredentials,
  TokenMissing: echo,

  InternalServerError: echo,
};

function HAuthError(code, message) {
  if (!ERRORS[code]) {
    throw new TypeError('HAuthError not defined: ' + code);
  }

  this.code = code;

  this.message = ERRORS[code](message);

  Error.call(this);
};

util.inherits(HAuthError, Error);

HAuthError.prototype.name = 'HAuthError';

module.exports = HAuthError;