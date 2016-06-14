// third-party
const mongoose = require('mongoose');

// constants
const Schema = mongoose.Schema;

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

  _accLockId: {
    type: String,
    required: true
  },

  _accVerifLockId: {
    type: String,
    required: true
  },
});

module.exports = function (conn, options) {
  var User = conn.model('User', userSchema);
  
  return User;
}