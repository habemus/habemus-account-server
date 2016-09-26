// third-party dependencies
const mongoose = require('mongoose');

// constants
const Schema = mongoose.Schema;

/**
 * Auxiliary schema that defines status
 * 
 * @type {Schema}
 */
var statusSchema = new Schema({
  /**
   * Machine friendly string that names the status
   * @type {String}
   */
  value: {
    type: String,
    required: true,
  },

  /**
   * Machine friendly string that denotes the reason
   * the item is in this status
   * @type {String}
   */
  reason: {
    type: String,
    required: true
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },

  notBefore: {
    type: Date,
  },

  expiresAt: {
    type: Date,
  },

  /**
   * Arbitrary metadata
   * @type {Object}
   */
  detail: {
    type: Object
  }
});

module.exports = statusSchema;
