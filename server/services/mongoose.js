const mongoose = require('mongoose');
const Bluebird = require('bluebird');

// set mongoose's default promise constructor
mongoose.Promise = Bluebird;

module.exports = function (app, options) {
  
  var mongooseService = {};
  
  return new Bluebird((resolve, reject) => {
    var conn = mongoose.createConnection(options.mongodbURI);
    
    mongooseService.connection = conn;
    
    conn.once('connected', _resolve);
    conn.once('error', _reject);
    conn.once('disconnected', _reject);

    function off () {
      conn.removeListener('connected', _resolve);
      conn.removeListener('error', _reject);
      conn.removeListener('disconnected', _reject);
    }

    function _resolve () {
      off();
      resolve();
    }

    function _reject () {
      off();
      reject();
    }
  })
  .then(() => {
    
    var conn = mongooseService.connection;
    
    // load models
    mongooseService.models = {};
    mongooseService.models.Account =
      require('../models/account')(conn, app, options);
    mongooseService.models.ProtectedActionRequest =
      require('../models/protected-action-request')(conn, app, options);

    return new Bluebird((resolve, reject) => {
      // wait some time for the indexes to be ready before resolving

      setTimeout(resolve.bind(null, mongooseService), 100);
    });
  });
};
