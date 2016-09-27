function _objValues(obj) {
  return Object.keys(obj).map((key) => {
    return obj[key];
  });
}

/**
 * Used for attempting to unlock all locks
 * @type {String}
 */
exports.ATTEMPTER_ID = 'h-account-attempter';

exports.REQUEST_STATUSES = {
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
  CANCELLED: 'cancelled',
};
exports.VALID_REQUEST_STATUSES = _objValues(exports.REQUEST_STATUSES);

exports.ACCOUNT_STATUSES = {
  UNVERIFIED: 'unverified',
  VERIFIED: 'verified',
  CANCELLED: 'cancelled',
};
exports.VALID_ACCOUNT_STATUSES = _objValues(exports.ACCOUNT_STATUSES);
