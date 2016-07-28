/**
 * Light version that only decodes the token's Payload
 * @param  {String|JWT} token
 * @return {Object}
 */
exports.decodeJWTPayload = function (token) {

  var payload = token.split('.')[1];

  if (!payload) {
    throw new Error('Invalid token');
  }

  return JSON.parse(atob(payload));
};