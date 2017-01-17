// third-party
const mongoose   = require('mongoose');
const uuid       = require('uuid');
const makeStatus = require('mongoose-make-status');
const Bluebird   = require('bluebird');

// constants
const Schema = mongoose.Schema;
const CONSTANTS = require('../../shared/constants');
const errors = require('../../shared/errors');

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
      unique: true,
    },

    /**
     * Id of the lock used for authenticate the account.
     * 
     * @type {Object}
     */
    _accLockId: {
      type: String,
      required: true
    },

    createdAt: {
      type: Date,
      default: Date.now
    },

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

    /**
     * Data related to the account's owner
     *
     * Store the data in a scoped object so
     * that it is clear that the changes are not
     * overriding the account's special information.
     * 
     * @type {SchemaOrg/Person}
     */
    ownerData: {
      /**
       * Taken from schema.org
       * https://schema.org/Person
       * 
       * @type {Object}
       */
      givenName: {
        type: String,
        required: true,
      },

      /**
       * Family name. In the U.S., the last name of an Person.
       * This can be used along with givenName instead of the name property.
       * @type {String}
       */
      familyName: {
        type: String,
      },

      /**
       * An additional name for a Person, can be used for a middle name.
       * @type {String}
       */
      additionalName: {
        type: String,
      },

      /**
       * An image of the item. This can be a URL or a fully described ImageObject.
       * @type {URL}
       */
      image: {
        type: String,
      }
    },

    /**
     * Account preferences.
     * These preferences are not related specifically
     * to any application.
     * 
     * @type {Object}
     */
    preferences: {
      language: {
        type: String,
        default: 'en-US',
      }
    },

    /**
     * Application-specific configurations
     * keyed by application name.
     * 
     * @type {Object}
     */
    applicationConfig: {

      dashboard: {
        language: {
          type: String,
          default: 'en-US',
        },
        version: {
          type: String,
          default: 'v1',
        },
        guides: {
          type: Object,
          default: {
            'dashboard': 'new',
            'project-general': 'new',
            'project-history': 'new',
            'project-domain': 'new',
            'project-billing': 'new',
          }
        }
      },

      workspace: {
        language: {
          type: String,
          default: 'en-US',
        },
        version: {
          type: String,
          default: 'disabled',
        },
        guides: {
          type: Object,
          default: {
            'editor': 'new',
            'preview': 'new',
          }
        },
      }
    },

    /**
     * Data on how the user has found out about Habemus.
     * 
     * @type {Object}
     */
    referrer: Object,

    /**
     * Legal data objects
     * @type {Object}
     */
    legal: {
      termsOfService: {
        agreed: {
          type: Boolean,
          required: true,
          validate: {
            validator: function (accepted) {
              if (!accepted) {
                return false;
              } else {
                return true;
              }
            },
            message: 'InvalidEmail',
          }
        },
        version: {
          type: String,
          default: 'v1',
        }
      },
    },

    /**
     * Meta data. Meant for storing internal data,
     * not user-configurable data.
     * 
     * @type {Object}
     */
    meta: Object,
  });

  makeStatus(accountSchema, {
    statuses: CONSTANTS.VALID_ACCOUNT_STATUSES
  });
  
  // statics
  accountSchema.statics.isEmail = isEmail;

  // methods
  /**
   * Set account owner data
   * @param {Object} ownerData
   */
  accountSchema.methods.setOwnerData = function (ownerData) {
    for (var ownerDataKey in ownerData) {
      this.set('ownerData.' + ownerDataKey, ownerData[ownerDataKey]);
    }
  };
  
  /**
   * Set account preferences
   * @param {Object} preferences
   */
  accountSchema.methods.setPreferences = function (preferences) {
    for (var preferenceName in preferences) {
      this.set('preferences.' + preferenceName, preferences[preferenceName]);
    }
  };

  /**
   * Set applicationId configurations
   * @param {String} applicationId
   * @param {Object} config
   */
  accountSchema.methods.setApplicationConfig = function (applicationId, config) {

    if (app.constants.VALID_APPLICATION_IDS.indexOf(applicationId) === -1) {
      throw new app.errors.InvalidOption('applicationId', 'invalid');
    }

    for (var configName in config) {
      this.set('applicationConfig.' + applicationId + '.' + configName, config[configName]);
    }
  };

  /**
   * Account variable will be hoisted in the script and static methods
   * will have access to it.
   * 
   * @type {Model}
   */
  var Account = conn.model('Account', accountSchema);
  
  return Account;
};
