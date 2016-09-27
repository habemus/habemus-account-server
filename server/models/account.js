// third-party
const mongoose   = require('mongoose');
const uuid       = require('uuid');
const makeStatus = require('mongoose-make-status');

// constants
const Schema = mongoose.Schema;
const CONSTANTS = require('../../shared/constants');

/**
 * Verifies whether a string is in a valid email format
 * @param {String} str
 */
// http://stackoverflow.com/questions/46155/validate-email-address-in-javascript#46181
const EMAIL_REGEXP = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
function isEmail(str) {
  return EMAIL_REGEXP.test(str);
}

module.exports = function (conn, app, options) {

  var accountSchema = new Schema({

    /**
     * TODO: we must explore what's the most efficient and safe
     * way to use uuids as _id in mongodb.
     * Had difficulties in finding adequate docs for the problems
     * described in the following post, so I (Simon) preferred
     * to play it safe and use String instead of BSON.
     * http://3t.io/blog/best-practices-uuid-mongodb/
     * 
     * @type {String}
     */
    _id: {
      type: String,
      default: uuid.v4,
    },

    createdAt: {
      type: Date,
      default: Date.now
    },

    // status: {
    //   type: Status,
    //   required: true,
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
      validate: {
        validator: isEmail,
        message: 'InvalidEmail',
      }
    },

    _accLockId: {
      type: String,
      required: true
    },
  });

  makeStatus(accountSchema, {
    statuses: CONSTANTS.VALID_ACCOUNT_STATUSES
  });

  // /**
  //  * Sets the user account status to 'active';
  //  * @param {String} reason
  //  */
  // accountSchema.methods.setAccountActive = function (reason) {
  //   if (!reason) { throw new Error('reason is required'); }

  //   this.status = {
  //     value: app.constants.ACCOUNT_STATUSES.ACTIVE,
  //     reason: reason,
  //   };
  // };

  /**
   * Sets the user account status to 'cancelled';
   * @param {String} reason
   */
  // still not implemented
  // accountSchema.methods.setAccountCancelled = function (reason) {
  //   if (!reason) { throw new Error('reason is required'); }
    
  //   this.accountStatus = {
  //     status: 'verified',
  //     updatedAt: Date.now(),
  //     reason: reason,
  //   };
  // };
  
  // statics
  accountSchema.statics.isEmail = isEmail;

  var Account = conn.model('Account', accountSchema);
  
  return Account;
};
