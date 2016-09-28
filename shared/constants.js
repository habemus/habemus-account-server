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

/**
 * Paths to the ui of account-related verified requests.
 * @type {String}
 */
// exports.UI_ACCOUNT_EMAIL_VERIFICATION_PATH         = '/email-verification';
exports.UI_ACCOUNT_EMAIL_VERIFICATION_SUCCESS_PATH = '/email-verification-success';
exports.UI_ACCOUNT_EMAIL_VERIFICATION_ERROR_PATH   = '/email-verification-error';

exports.UI_PASSWORD_RESET_PATH         = '/password-reset';
exports.UI_PASSWORD_RESET_SUCCESS_PATH = '/password-reset-success';
exports.UI_PASSWORD_RESET_ERROR_PATH   = '/password-reset-error'
