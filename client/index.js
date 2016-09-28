// third-party
const superagent = require('superagent');
const Bluebird   = require('bluebird');

// constants
const TRAILING_SLASH_RE = /\/$/;

/**
 * Constructor
 * @param {Object} options
 *        - serverURI
 */
function PrivateHAccount(options) {

  if (!options.serverURI) {
    throw new Error('serverURI is required');
  }

  this.serverURI = options.serverURI.replace(TRAILING_SLASH_RE, '');
}

Object.assign(PrivateHAccount.prototype, require('./methods/public'));

module.exports = PrivateHAccount;
