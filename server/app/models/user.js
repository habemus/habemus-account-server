// third-party
const mongoose = require('mongoose');

// constants
const Schema = mongoose.Schema;

// sub-schemas
const Status = require('./sub-schemas/status');

module.exports = function (conn, app, options) {

  var userSchema = new Schema({
    createdAt: {
      type: Date,
      default: Date.now
    },

    status: {
      type: Status,
      required: true,
    },

    // accountStatus: {
    //   status: {
    //     type: String,
    //     default: app.constants.ACCOUNT_STATUSES.unverified,
    //   },
    //   reason: {
    //     type: String,
    //   },
    //   updatedAt: {
    //     type: Date,
    //   }
    // },

    verifiedAt: {
      type: Date
    },

    username: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    _accLockId: {
      type: String,
      required: true
    },
  });

  /**
   * Sets the user account status to 'active';
   * @param {String} reason
   */
  userSchema.methods.setAccountActive = function (reason) {
    if (!reason) { throw new Error('reason is required'); }

    this.accountStatus = {
      status: app.constants.ACCOUNT_STATUSES.active,
      updatedAt: Date.now(),
      reason: reason,
    };
  };

  /**
   * Sets the user account status to 'cancelled';
   * @param {String} reason
   */
  // still not implemented
  // userSchema.methods.setAccountCancelled = function (reason) {
  //   if (!reason) { throw new Error('reason is required'); }
    
  //   this.accountStatus = {
  //     status: 'verified',
  //     updatedAt: Date.now(),
  //     reason: reason,
  //   };
  // };

  var User = conn.model('User', userSchema);
  
  return User;
}