// native
const fs   = require('fs');
const path = require('path');

// third-party dependencies
const uuid     = require('node-uuid');
const mustache = require('mustache');
const mongoose = require('mongoose');
const Bluebird = require('bluebird');

const ValidationError = mongoose.Error.ValidationError;
const ValidatorError  = mongoose.Error.ValidatorError;

const hLock = require('h-lock');

// 
const verifyAccountEmailTemplate = fs.readFileSync(path.join(__dirname, '../../email-templates/verify-account.html'), 'utf8');
const ATTEMPTER_ID = 'h-auth-attempter';

const CONSTANTS = require('../../../shared/constants');

module.exports = function (app, options) {

  const errors = app.errors;
  const User = app.models.User;

  var userCtrl = {};

  /**
   * Creates a user given user
   * @param  {Object} userData
   * @return {Bluebird -> user}
   */
  userCtrl.create = function (userData) {

    if (!userData.username) {
      return Bluebird.reject(new errors.InvalidOption(
        'username',
        'required',
        'username is required to create user account'
      ));
    }

    if (!userData.password) {
      return Bluebird.reject(new errors.InvalidOption(
        'password',
        'required',
        'password is required to create an user account'
      ));
    }

    if (!userData.email) {
      return Bluebird.reject(new errors.InvalidOption(
        'email',
        'required',
        'email is required'
      ));
    }

    // variable to hold reference to data needed throughout multiple 
    // steps
    var _user;
    
    return Bluebird.resolve(app.services.accountLock.create(userData.password))
      .then((accountLockId) => {
        userData._accLockId = accountLockId;
        
        userData.status = {
          value: CONSTANTS.ACCOUNT_STATUSES.UNVERIFIED,
          reason: 'NewlyCreated',
        };

        var user = new User(userData);

        return user.save();
      })
      .catch((err) => {
        // failed to create user account
        
        if (err.name === 'MongoError' && err.code === 11000) {
          // TODO: improvement research:
          // for now we infer that any 11000 error (duplicate key)
          // refers to username repetition
          // UPDATE: it seems there is no actual good solution
          // other than RegExp the error message.
          // For now, we'll run db checks to check what is the offending field
          // https://github.com/Automattic/mongoose/issues/2129
          
          return userCtrl.getByUsername(userData.username)
            .then((user) => {
              // user with given username was found, return UsernameTaken
              return Bluebird.reject(new errors.UsernameTaken(userData.username));

            }, (err) => {

              if (err instanceof errors.UserNotFound) {
                // user for the username was not found, check if the email is taken
                return userCtrl.getByEmail(userData.email);
              } else {
                return Bluebird.reject(err);
              }

            })
            .then((user) => {
              // user with given email was found, return EmailTaken
              return Bluebird.reject(new errors.EmailTaken(userData.email));
            }, (err) => {
              // strange error, as nor username nor email were taken.
              // probably good to log error and just let Internal server error happen
              console.warn('strange unique error on user creation', err);
              return Bluebird.reject(err);
            });
        }

        // by default reject using the original error
        return Bluebird.reject(err);
      })
      .then((user) => {
        // user was successfully saved to the database
        _user = user;
        var userId = user.get('_id').toString();

        // initiate request to verify the user's account
        return app.controllers.accVerification.createRequest(userId);
      })
      .then(() => {
        return _user;
      });
  };
  
  userCtrl.delete = function (username) {

    if (!username) {
      return Bluebird.reject(new errors.InvalidOption(
        'username',
        'required',
        'username is required to delete user account'
      ));
    }

    return Bluebird.resolve(User.findOneAndRemove({ username: username }))
      .then((user) => {
        // make sure to return nothing
        return;
      });
  };

  userCtrl.getById = function (userId) {

    console.warn('DEPRECATE: userCtrl.getById');

    if (!userId) {
      return Bluebird.reject(new errors.InvalidOption(
        'userId',
        'required',
        'userId is required to retrieve user account'
      ));
    }

    return Bluebird.resolve(User.findOne({ _id: userId }))
      .then((user) => {
        if (!user) {
          return Bluebird.reject(new errors.UserNotFound(userId));
        } else {
          return user;
        }
      });
  };

  userCtrl.getByUsername = function (username) {

    if (!username) {
      return Bluebird.reject(new errors.InvalidOption(
        'username',
        'required',
        'username is required to retrieve user account by username'
      ));
    }

    return Bluebird.resolve(User.findOne({ username: username }))
      .then((user) => {
        if (!user) {
          return Bluebird.reject(new errors.UserNotFound(username));
        } else {
          return user;
        }
      });
  };

  userCtrl.getByEmail = function (email) {
    if (!email) {
      return Bluebird.reject(new errors.InvalidOption(
        'email',
        'required',
        'email is required to retrieve user account by email'
      ));
    }

    return Bluebird.resolve(User.findOne({ email: email }))
      .then((user) => {
        if (!user) {
          return Bluebird.reject(new errors.UserNotFound(email));
        } else {
          return user;
        }
      });
  };

  return userCtrl;
};