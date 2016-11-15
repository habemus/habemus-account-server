exports.TOKEN_DATA = {
  sub: true,
  username: true,
  'status.value': true,
  'status.updatedAt': true,
  iat: true,
  exp: true,
};

/**
 * Currently used for exposing data for the account
 * to the account owner.
 * May require modfications for total public usage (e.g. remove email)
 * 
 * @type {Object}
 */
exports.ACCOUNT_DATA = {
  username: true,
  email: true,
  createdAt: true,
  'status.value': true,
  'status.reason': true,
  'status.updatedAt': true,

  ownerData: true,

  'preferences': true,
  'applicationConfig': true,
};
