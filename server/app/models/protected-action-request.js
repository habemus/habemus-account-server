// third-party
const mongoose = require('mongoose');

// constants
const Schema = mongoose.Schema;

// internal dependencies
const Status = require('./sub-schemas/status');

var protectedActionRequestSchema = new Schema({
  createdAt: {
    type: Date,
    default: Date.now
  },

  /**
   * Indicates on which user the action should be carried on
   * @type {String}
   */
  userId: {
    type: String,
    required: true
  },

  /**
   * Indicates which action should be carried
   * @type {String}
   */
  action: {
    type: String,
    required: true
  },

  /**
   * Indicates when the request expires
   * @type {Date}
   */
  expiresAt: {
    type: Date,
    required: true,
    index: {
      // auto remove the request from the database after 30 days
      expires: 30 * 24 * 60 * 60
    }
  },

  status: {
    type: Status,
    required: true,
  },

  /**
   * Status at which the request is
   * @type {String}
   */
  // status: {
  //   type: String,
  //   required: true
  // },

  /**
   * Special property to store the reason for request cancellation
   * @type {String}
   */
  cancelReason: {
    type: String,
  },

  /**
   * Reference to the lock that protects this action
   * @type {String}
   */
  lockId: {
    type: String,
    required: true
  }
});

module.exports = function (conn, app, options) {

  /**
   * Verifies whether the request has expired
   * @return {Boolean}
   */
  protectedActionRequestSchema.methods.hasExpired = function () {
    return Date.now() > this.expiresAt.getTime();
  };

  var ProtectedActionRequest = conn.model('ProtectedActionRequest', protectedActionRequestSchema);
  
  return ProtectedActionRequest;
}