// native dependencies
const fs = require('fs');
const path = require('path');

// third-party
const Bluebird = require('bluebird');
const uuid     = require('uuid');
const ms       = require('ms');
const pwdGen   = require('password-generator');

const hLock  = require('h-lock');

const DEFAULT_CODE_LENGTH = 7;
const DEFAULT_VERIFICATION_EXPIRY = ms('1d');

const VALID_ACTIONS = [
  'verifyAccountEmail',
  'resetPassword',
];

/**
 * Auxiliary function that generates a random code of given length
 * @param  {Number} length
 * @return {String}
 */
function _genCode(length) {
  var code = pwdGen(length, false);

  if (length > code.length) {
    throw new Error(length + ' is not supported');
  }

  return code.substr(0, length);
}

module.exports = function (app, options) {

  const errors = app.errors;

  const ProtectedActionRequest = app.services.mongoose.models.ProtectedActionRequest;
  const User                   = app.services.mongoose.models.User;

  const FROM_EMAIL = options.fromEmail;

  var protectedRequestCtrl = {};

  /**
   * Creates a verification request
   * @param  {String} userId
   * @param  {String} actionName
   * @return {Bluebird}
   */
  protectedRequestCtrl.create = function (userId, actionName, options) {
    if (!userId) {
      return Bluebird.reject(new errors.InvalidOption(
        'userId',
        'required',
        'userId is required'
      ));
    }

    if (!actionName) {
      return Bluebird.reject(new errors.InvalidOption(
        'actionName',
        'required',
        'actionName is required'
      ));
    }

    if (VALID_ACTIONS.indexOf(actionName) === -1) {
      return Bluebird.reject(new errors.InvalidOption(
        'actionName',
        'unsupported',
        'actionName not supported'
      ));
    }

    options = options || {};

    // parse out options
    var codeLength = options.codeLength || DEFAULT_CODE_LENGTH;
    var expiresIn = options.expiresIn || DEFAULT_VERIFICATION_EXPIRY;
    expiresIn = (typeof expiresIn === 'string') ? ms(expiresIn) : expiresIn;
    
    // generate a code
    var confirmationCode = _genCode(codeLength);

    // cancel all previous verification requests
    return protectedRequestCtrl.cancelUserRequests(userId, actionName, 'NewRequestMade')
      .then(() => {
        // create a lock using the confirmationCode
        return app.services.verificationLock.create(confirmationCode);
      })
      .then((lockId) => {

        // create a ProtectedActionRequest
        var actionRequest = new ProtectedActionRequest({
          userId: userId,
          action: actionName,
          lockId: lockId,
          // status: app.constants.REQUEST_STATUSES.PENDING,
          expiresAt: Date.now() + expiresIn,
        });

        actionRequest.setStatus(
          app.constants.REQUEST_STATUSES.PENDING,
          'UserRequested'
        );

        return actionRequest.save();
      })
      .then((request) => {
        return confirmationCode;
      });
  };

  /**
   * Cancel all account verification requests 
   * for a given user and 
   * for a given reason
   * @param  {String} userId
   * @param  {String} reason
   * @return {Bluebird -> void}
   */
  protectedRequestCtrl.cancelUserRequests = function (userId, actionName, reason) {

    if (!userId) {
      return Bluebird.reject(new errors.InvalidOption(
        'userId',
        'required',
        'userId is required'
      ));
    }

    if (!actionName) {
      return Bluebird.reject(new errors.InvalidOption(
        'actionName',
        'required',
        'actionName is required'
      ));
    }

    if (!reason) {
      return Bluebird.reject(new errors.InvalidOption(
        'reason',
        'required',
        'reason is required'
      ));
    }

    var requestQuery = {
      // load all requests of a given user
      userId: userId,
      // for the verification action
      action: actionName,
    };

    // scope the query to PENDING status
    ProtectedActionRequest.scopeQueryByStatuses(requestQuery, [
      app.constants.REQUEST_STATUSES.PENDING
    ]);

    return Bluebird.resolve(ProtectedActionRequest.update(requestQuery, {
      status: {
        value: app.constants.REQUEST_STATUSES.CANCELLED,
        reason: reason,
      },
    }))
    .then(() => {
      return;
    });

  };

  /**
   * Attempt to verify a user with a verificationCode
   * @param  {String} userId
   * @param  {String} confirmationCode
   * @return {Bluebird}
   */
  protectedRequestCtrl.verifyRequestConfirmationCode = function (userId, actionName, confirmationCode) {
    if (!userId) {
      return Bluebird.reject(new errors.InvalidOption(
        'userId',
        'required',
        'userId is required'
      ));
    }

    if (!actionName) {
      return Bluebird.reject(new errors.InvalidOption(
        'actionName',
        'required',
        'actionName is required'
      ));
    }

    if (!confirmationCode) {
      return Bluebird.reject(new errors.InvalidOption(
        'confirmationCode',
        'required',
        'confirmationCode is required'
      ));
    }
    
    var requestQuery = {
      // request for the userId
      userId: userId,
      // for the verification action
      action: actionName,
      // let the expiry verification be made at the application
      // level so that we may inform the user about the expiry
      // expiresAt:
    };

    // scope query to PENDING status
    ProtectedActionRequest.scopeQueryByStatuses(requestQuery, [
      app.constants.REQUEST_STATUSES.PENDING,
    ]);

    /**
     * These options are to guarantee that only the latest
     * request will be checked against, so that if any inconsistencies
     * in the database happen, the latest request prevails.
     * @type {Object}
     */
    var requestFindOptions = {
      sort: {
        // load latest
        createdAt: -1
      }
    }

    var _request;

    // load the request that originated the verification flow
    return Bluebird.resolve(ProtectedActionRequest.findOne(
      requestQuery,
      null,
      requestFindOptions
    ))
    .then((request) => {

      _request = request;

      if (!request) {
        // request was not even found
        // verification code must be invalid
        // 
        // this is a very special situation,
        // when someone is trying to verify against non-existent request
        return Bluebird.reject(new errors.InvalidCredentials());
      }

      if (request.hasExpired()) {
        return Bluebird.reject(new errors.InvalidCredentials('CredentialsExpired'));
      }

      // get the lock and attempt to unlock it
      var lockId = request.get('lockId');
      
      return app.services.verificationLock.unlock(
        // unlock the lock
        lockId,
        // using code
        confirmationCode,
        // and let the app's default attempter be the one blamed
        // for attempting to unlock
        app.constants.ATTEMPTER_ID
      );

    })
    .then(() => {
      // set the request's status
      _request.setStatus(
        app.constants.REQUEST_STATUSES.FULFILLED,
        'VerificationSuccessful'
      );
      
      return _request.save();
    })
    .then(() => {
      // make sure to return nothing
      return;
    })
    .catch((err) => {

      if (err instanceof hLock.errors.InvalidSecret) {
        return Bluebird.reject(new errors.InvalidCredentials())
      }

      // default behavior is to reject with the original error
      return Bluebird.reject(err);
    });
  };

  return protectedRequestCtrl;
};