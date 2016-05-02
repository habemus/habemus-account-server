// third-party
var mongoose = require('mongoose');

// constants
const Schema = mongoose.Schema;

var tokenRevocationEntrySchema = new Schema({
  tokenId: {
    type: String,
    required: true
  },
});

module.exports = function (conn, options) {

  var TokenRevocationEntry = conn.model('TokenRevocationEntry', tokenRevocationEntrySchema);
  
  return TokenRevocationEntry;
};