// third-party
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt');
var BPromise = require('bluebird');

// constants
const DEFAULT_SALT_ROUNDS = 10;
const Schema = mongoose.Schema;

var userSchema = new Schema({
  createdAt: {
    type: Date,
    default: Date.now
  },

  username: {
    type: String,
    required: true,
    unique: true,
  },

  hash: {
    type: String,
    required: true
  }
});

userSchema.methods.validatePassword = function (plainTextPwd) {

  var hash = this.hash;

  return new BPromise((resolve, reject) => {
    bcrypt.compare(plainTextPwd, hash, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(result);
    });
  });
};

module.exports = function (conn, options) {

  var saltRounds = options.saltRounds || DEFAULT_SALT_ROUNDS;

  userSchema.statics.encryptPassword = function (plainTextPwd) {

    return new BPromise((resolve, reject) => {
      bcrypt.hash(plainTextPwd, saltRounds, (err, hash) => {

        if (err) {
          reject(err);
          return;
        }

        resolve(hash);
      });
    });
  };

  var User = conn.model('User', userSchema);

  // User.ensureIndexes({ background: false }, (err) => {
  //   if (err) {
  //     console.warn('indexing error', err);
  //   } else {
  //     console.info('indexing success');
  //   }
  // });
  
  User.on('index', (err) => {
    if (err) {
      console.warn('indexing error', err);
    } else {
      console.info('indexing success');
    }
  });

  return User;
}