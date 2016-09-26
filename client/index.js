// third-party
const superagent = require('superagent');
const Bluebird   = require('bluebird');

// auxiliary
const aux = require('./auxiliary');

/**
 * Constructor
 * @param {Object} options
 *        - serverURI
 */
function HAccount(options) {

  if (!options.serverURI) {
    throw new Error('serverURI is required');
  }

  this.serverURI = options.serverURI.replace(aux.TRAILING_SLASH_RE, '');
}

Object.assign(HAccount.prototype, require('./methods/shared'));
Object.assign(HAccount.prototype, require('./methods/public'));
