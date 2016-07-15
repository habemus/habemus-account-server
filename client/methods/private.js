/**
 * Saves the token to the browser localstorage
 * @private
 * @param  {String} token
 */
exports._saveAuthToken = function (token) {
  var tokenStorageKey = this.localStoragePrefix + 'auth_token';

  window.localStorage.setItem(tokenStorageKey, token);
};

/**
 * Deletes the token from the browser's localstorage
 * @private
 */
exports._destroyAuthToken = function () {
  var tokenStorageKey = this.localStoragePrefix + 'auth_token';

  window.localStorage.removeItem(tokenStorageKey);
};

/**
 * Changes the authentication status and emits `auth-status-change` event
 * if the auth-status has effectively been changed by the new value setting.
 */
exports._setAuthStatus = function (status) {

  var hasChanged = (this.status !== status);

  this.status = status;

  if (hasChanged) {
    this.emit('auth-status-change', status);
  }
};
