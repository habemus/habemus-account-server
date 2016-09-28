// constants
const errors = require('../errors');

/**
 * Light version that only decodes the token's Payload
 * @param  {String|JWT} token
 * @return {Object}
 */
exports.decodeJWTPayload = function (token) {

  var payload = token.split('.')[1];

  if (!payload) {
    throw new errors.InvalidToken(token);
  }

  return JSON.parse(atob(payload));
};
