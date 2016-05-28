// third-party
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
const BPromise = require('bluebird');
const uuid     = require('node-uuid');

// constants
const DEFAULT_SALT_ROUNDS = 10;
const Schema = mongoose.Schema;

// promisified methods
const _bcryptHash    = BPromise.promisify(bcrypt.hash);
const _bcryptCompare = BPromise.promisify(bcrypt.compare);

var userSchema = new Schema({
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
  },

  pwdHash: {
    type: String,
    required: true
  },

  accVerifHash: {
    type: String,
    required: true
  }
});

userSchema.methods.validatePassword = function (plainTextPwd) {

  var hash = this.pwdHash;

  return _bcryptCompare(plainTextPwd, hash);
};

userSchema.methods.validateAccountVerificationCode = function (plainTextVerificationCode) {

  var hash = this.accVerifHash;

  return _bcryptCompare(plainTextVerificationCode, hash);
};

module.exports = function (conn, options) {

  var saltRounds = options.saltRounds || DEFAULT_SALT_ROUNDS;

  /**
   * Hashes a password
   * @param  {[type]} plainTextPwd [description]
   * @return {[type]}              [description]
   */
  userSchema.statics.encryptPassword = function (plainTextPwd) {
    return _bcryptHash(plainTextPwd, saltRounds);
  };

  /**
   * Generates a confirmation code
   * @return {Object}
   *         - code: should never be stored anywhere
   *         - hash: bcrypt hashed code
   */
  userSchema.statics.generateAccountConfirmationCode = function () {
    // generate a code
    var code = uuid.v4();

    return _bcryptHash(code, saltRounds).then((hash) => {

      return {
        code: code,
        hash: hash
      };

    });
  };

  var User = conn.model('User', userSchema);
  
  return User;
}