// native
const fs   = require('fs');
const path = require('path');

// third-party dependencies
const mongoose = require('mongoose');
const Bluebird = require('bluebird');

const ValidationError = mongoose.Error.ValidationError;
const ValidatorError  = mongoose.Error.ValidatorError;

const CONSTANTS = require('../../shared/constants');

module.exports = function (app, options) {

  const errors  = app.errors;
  const Account = app.services.mongoose.models.Account;

  var accountCtrl = {};

  /**
   * Creates a user given user
   * @param  {Object} accountData
   * @return {Bluebird -> user}
   */
  accountCtrl.create = function (accountData) {

    if (!accountData.username) {
      return Bluebird.reject(new errors.InvalidOption(
        'username',
        'required',
        'username is required to create user account'
      ));
    }

    if (!accountData.password) {
      return Bluebird.reject(new errors.InvalidOption(
        'password',
        'required',
        'password is required to create an user account'
      ));
    }

    if (!accountData.email) {
      return Bluebird.reject(new errors.InvalidOption(
        'email',
        'required',
        'email is required'
      ));
    }

    // pick the password and remove it from account data
    // to ensure it is not passed on
    var password = accountData.password;
    delete accountData.password;

    // variable to hold reference to data needed throughout multiple 
    // steps
    var _account;
    
    return Bluebird.resolve(app.services.accountLock.create(password))
      .then((accountLockId) => {

        accountData._accLockId = accountLockId;

        var account = new Account(accountData);

        account.setStatus(
          CONSTANTS.ACCOUNT_STATUSES.NEW,
          'NewlyCreated'
        );

        return account.save();
      })
      .catch((err) => {
        // failed to create account
        
        if (err.name === 'MongoError' && err.code === 11000) {
          // TODO: improvement research:
          // for now we infer that any 11000 error (duplicate key)
          // refers to username repetition
          // UPDATE: it seems there is no actual good solution
          // other than RegExp the error message.
          // For now, we'll run db checks to check what is the offending field
          // https://github.com/Automattic/mongoose/issues/2129
          
          return accountCtrl.getByUsername(accountData.username)
            .then((account) => {
              // account with given username was found, return UsernameTaken
              return Bluebird.reject(new errors.UsernameTaken(accountData.username));

            }, (err) => {

              if (err instanceof errors.UserNotFound) {
                // account for the username was not found, check if the email is taken
                return accountCtrl.getByEmail(accountData.email);
              } else {
                return Bluebird.reject(err);
              }

            })
            .then((account) => {
              // account with given email was found, return EmailTaken
              return Bluebird.reject(new errors.EmailTaken(accountData.email));
            });

        } else if (err instanceof ValidationError) {

          if (err.errors.email && err.errors.email.message === 'InvalidEmail') {
            return Bluebird.reject(new errors.InvalidOption('email', 'invalid'));
          }
        }

        // by default reject using the original error
        return Bluebird.reject(err);
      })
      .then((account) => {
        // account was successfully saved to the database
        _account = account;

        // initiate request to verify the account's email
        return app.controllers.emailVerification.createRequest(account.username);
      })
      .then(() => {
        return _account;
      });
  };
  
  /**
   * Removes an account and all related resources:
   *   - accountLock
   *   - auxiliaryLocks
   * 
   * @param  {Account} account
   * @return {Bluebird}
   */
  accountCtrl.delete = function (account) {

    if (!account) {
      return Bluebird.reject(new errors.InvalidOption(
        'account',
        'required',
        'account is required to delete user account'
      ));
    }

    account.setStatus(
      app.constants.ACCOUNT_STATUSES.CANCELLED,
      'Deleted'
    );

    var _account;

    return account.save().then((acc) => {
      _account = acc;

      return Bluebird.all([
        app.services.accountLock.destroy(_account._accLockId),
        app.controllers.emailVerification.cancelUserRequests(_account.username, 'AccountDeleted'),
        app.controllers.passwordReset.cancelUserRequests(_account.username, 'AccountDeleted'),

        // TODO: revoke tokens associated to the account
        // TODO: inform other systems of the account deletion, so that they may
        // remove resources associated to the account
      ]);
    })
    .then(() => {
      return _account.remove();
    });
  };

  accountCtrl.getById = function (id) {

    if (!id) {
      return Bluebird.reject(new errors.InvalidOption(
        'id',
        'required',
        'id is required to retrieve user account'
      ));
    }

    return Bluebird.resolve(Account.findOne({ _id: id }))
      .then((user) => {
        if (!user) {
          return Bluebird.reject(new errors.UserNotFound(id));
        } else {
          return user;
        }
      });
  };

  accountCtrl.getByUsername = function (username) {

    if (!username) {
      return Bluebird.reject(new errors.InvalidOption(
        'username',
        'required',
        'username is required to retrieve user account by username'
      ));
    }

    return Bluebird.resolve(Account.findOne({ username: username }))
      .then((user) => {
        if (!user) {
          return Bluebird.reject(new errors.UserNotFound(username));
        } else {
          return user;
        }
      });
  };

  accountCtrl.getByEmail = function (email) {
    if (!email) {
      return Bluebird.reject(new errors.InvalidOption(
        'email',
        'required',
        'email is required to retrieve user account by email'
      ));
    }

    return Bluebird.resolve(Account.findOne({ email: email }))
      .then((user) => {
        if (!user) {
          return Bluebird.reject(new errors.UserNotFound(email));
        } else {
          return user;
        }
      });
  };

  accountCtrl.getByUsernameOrEmail = function (usernameOrEmail) {
    if (!usernameOrEmail) {
      return Bluebird.reject(new errors.InvalidOption(
        'usernameOrEmail',
        'required',
        'usernameOrEmail is required to retrieve account by getByUsernameOrEmail method'
      ));
    }

    if (Account.isEmail(usernameOrEmail)) {
      // start trying to get the user by email
      return accountCtrl.getByEmail(usernameOrEmail).catch((err) => {
        if (err instanceof errors.UserNotFound) {
          // on not found error, attempt to get by username
          return accountCtrl.getByUsername(usernameOrEmail);
        } else {
          return Bluebird.reject(err);
        }
      });
    } else {
      // start by trying to get the user by username
      return accountCtrl.getByUsername(usernameOrEmail).catch((err) => {
        if (err instanceof errors.UserNotFound) {
          // on not found error, attempt to get by email
          return accountCtrl.getByEmail(usernameOrEmail);
        } else {
          return Bluebird.reject(err);
        }
      });
    }
  }

  return accountCtrl;
};