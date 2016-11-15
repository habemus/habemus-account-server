exports.TOKEN_DATA = {
  sub: true,
  username: true,
  'status.value': true,
  'status.updatedAt': true,
  iat: true,
  exp: true,
};

exports.ACCOUNT_DATA = {
  username: true,
  // email: true,
  createdAt: true,
  'status.value': true,
  'status.reason': true,
  'status.updatedAt': true,

  ownerData: true,

  'preferences': true,
  'applicationConfig': true,
};
