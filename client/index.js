// native
const util         = require('util');
const EventEmitter = require('events');

// third-party
const Bluebird = require('bluebird');

// constants
const TRAILING_SLASH_RE = /\/$/;

/**
 * Constructor
 * @param {Object} options
 *        - serverURI
 */
function HAccount(options) {

  if (!options.serverURI) {
    throw new Error('serverURI is required');
  }

  this.serverURI = options.serverURI.replace(TRAILING_SLASH_RE, '');
}

/**
 * Inherit from EventEmitter because we will need event-emitting functionality
 * in the browser (stateful) client.
 *
 * TODO: study other options for the inheritance chain to be set
 */
util.inherits(HAccount, EventEmitter);

Object.assign(HAccount.prototype, require('./methods/public'));

module.exports = HAccount;
