// native
const fs   = require('fs');
const path = require('path');

// third-party dependencies
const uuid     = require('node-uuid');
const mustache = require('mustache');
const mongoose = require('mongoose');

const ValidationError = mongoose.Error.ValidationError;
const ValidatorError  = mongoose.Error.ValidatorError;

// 
const verifyAccountEmailTemplate = fs.readFileSync(path.join(__dirname, '../../email-templates/verify-account.html'), 'utf8');

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

      return Promise.reject(err);
    }

    // variable to hold reference to data needed throughout multiple 
    // steps
    var _user;
    var _accVerifCode;

    // encrypt password and generate account confirmation code
    return Promise.all([
      User.encryptPassword(userData.password),
      User.generateAccountConfirmationCode()
    ]).then(function (values) {

      var pwdHash  = values[0];
      var accVerif = values[1];

      _accVerifCode = accVerif.code;

      // set the pwdHash and the accVerifirmationHash
      userData.pwdHash      = pwdHash;
      userData.accVerifHash = accVerif.hash;

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

      return new Promise((resolve, reject) => {
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
      return Promise.reject(err);
    })
    .then(function (sentEmail) {

      return _user;

    }, function (err) {
      // something bad happened.
      // if there is a user, remove it

      console.log(err);

      if (_user) {
        return _user.remove().then(() => {
          return Promise.reject(new app.Error('AccountVerificationEmailNotSent'));
        });
      } else {
        return Promise.reject(err);
      }
    });
  };

  userCtrl.validateAccountVerificationCode = function (userId, accVerifCode) {

    // check the validity of the userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return Promise.reject(new app.Error('UsernameNotFound'));
    }

    var _user;

    return User.findOne({
      _id: userId
    })
    .then((user) => {

      if (!user) {
        return Promise.reject(new app.Error('UsernameNotFound'));
      } else if (user.verifiedAt) {
        // user has already been verified
        return Promise.reject(new app.Error('InvalidVerificationCode'));

      } else {
        _user = user;

        return user.validateAccountVerificationCode(accVerifCode);
      }
    })
    .then((isValid) => {
      if (!isValid) {
        return Promise.reject(new app.Error('InvalidVerificationCode'));
      } else {
        _user.set('verifiedAt', Date.now());
        _user.set('accVerifHash', 'VERIFIED');

        return _user.save();
      }
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