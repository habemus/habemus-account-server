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
    var _accVerifCode = '12345';

    // create two locks, one for the user account
    // and one for the accountVerificationCode
    return Bluebird.all([
      app.services.accountLock.create(userData.password),
      app.services.verificationCodeLock.create(_accVerifCode)
    ])
    .then(function (lockIds) {
      var accountLockId          = lockIds[0];
      var verificationCodeLockId = lockIds[1];

      userData._accLockId      = accountLockId;
      userData._accVerifLockId = verificationCodeLockId;

      var user = new User(userData);

      return user.save();
    })
    .then(function (user) {

      // save reference to the user
      _user = user;

      // setup e-mail data
      var mailOptions = {
        from: options.fromEmail,
        to: user.get('email'),
        subject: 'Welcome to Habemus',
        html: mustache.render(verifyAccountEmailTemplate, {
          email: user.get('email'),
          code: _accVerifCode,
        }),
      };

      return new Bluebird((resolve, reject) => {
        app.services.nodemailer.sendMail(mailOptions, function (err, sentEmailInfo) {
          if (err) { reject(err); }

          resolve(sentEmailInfo);
        });
      });

    }, function (err) {
      // failed to save user
      
      if (err.name === 'MongoError' && err.code === 11000) {
        // TODO: improvement research:
        // for now we infer that any 11000 error (duplicate key)
        // refers to username repetition
        
        // redefine the error object
        err = new app.Error('UsernameTaken', userData.username);

      }

      if (err.name === 'ValidationError') {
        // throw err;
      }

      // always throw the error
      return Bluebird.reject(err);
    })
    .then(function (sentEmail) {

      return _user;

    }, function (err) {
      // something bad happened.
      // if there is a user, remove it
      if (_user) {
        return _user.remove().then(() => {
          return Bluebird.reject(new app.Error('AccountVerificationEmailNotSent'));
        });
      } else {
        return Bluebird.reject(err);
      }
    });
  };

  userCtrl.validateAccountVerificationCode = function (userId, accVerifCode) {

    // check the validity of the userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return Bluebird.reject(new app.Error('UsernameNotFound'));
    }

    var _user;

    return Bluebird.resolve(User.findOne({ _id: userId }))
      .then((user) => {

        if (!user) {
          return Bluebird.reject(new app.Error('UsernameNotFound'));
        } else if (user.verifiedAt) {
          // user has already been verified
          return Bluebird.reject(new app.Error('InvalidVerificationCode'));

        } else {
          _user = user;

          // get the lock
          var _accVerifLockId = user.get('_accVerifLockId');

          return app.services.verificationCodeLock.unlock(_accVerifLockId, accVerifCode, ATTEMPTER_ID);
        }
      })
      .then((isValid) => {
        _user.set('verifiedAt', Date.now());
        _user.set('accVerifHash', 'VERIFIED');

        return _user.save();
      })
      .catch((err) => {
        if (err instanceof hLock.errors.InvalidSecret) {
          return Bluebird.reject(new app.Error('InvalidVerificationCode'));
        }

        return Bluebird.reject(err);
      });
  };

  userCtrl.delete = function (userId) {
    return User.findOneAndRemove({ _id: userId });
  };

  userCtrl.getById = function (userId) {
    return User.findOne({ _id: userId });
  }

  return userCtrl;
};