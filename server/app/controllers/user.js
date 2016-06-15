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

module.exports = function (app, options) {

  const User = app.models.User;

  var userCtrl = {};

  userCtrl.create = function (userData) {

    // this specific validation must be run manually,
    // as the password is not defined at the User Model
    // 
    // following guide at
    // http://stackoverflow.com/questions/15012250/handling-mongoose-validation-errors-where-and-how#17024166
    if (!userData.password) {

      var err = new ValidationError();
      err.errors.password = new ValidatorError({
        path: 'password',
        message: '`password` is required',

        // type maps to kind internally by mongoose...
        // https://github.com/Automattic/mongoose/blob/4.4.19/lib/error/validator.js
        type: 'required',
        value: userData.password
      });

      return Bluebird.reject(err);
    }

    // variable to hold reference to data needed throughout multiple 
    // steps
    var _user;
    
    return Bluebird.resolve(app.services.accountLock.create(userData.password))
      .then((accountLockId) => {
        userData._accLockId = accountLockId;

        var user = new User(userData);

        return user.save();
      })
      .catch((err) => {
        // failed to save user
        
        if (err.name === 'MongoError' && err.code === 11000) {
          // TODO: improvement research:
          // for now we infer that any 11000 error (duplicate key)
          // refers to username repetition
          
          // redefine the error object
          return Bluebird.reject(new app.Error('UsernameTaken', userData.username));

        }

        if (err instanceof ValidationError) {
          return Bluebird.reject(err);
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
      .then((sentEmailInfo) => {
        return _user;
      });
  };

  userCtrl.delete = function (userId) {
    return Bluebird.resolve(User.findOneAndRemove({ _id: userId }));
  };

  userCtrl.getById = function (userId) {
    return Bluebird.resolve(User.findOne({ _id: userId }));
  }

  userCtrl.getByUsername = function (username) {
    return Bluebird.resolve(User.findOne({ username: username }));
  }

  return userCtrl;
};