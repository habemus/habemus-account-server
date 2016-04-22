// native dependencies
const path = require('path');
const http = require('http');

// third-party dependencies
const MongoClient = require('mongodb').MongoClient;

// internal dependencies
const pkg = require('../../package.json');
const createHabemusAuth = require('../../');

// constants
const TEST_DB_URI = 'mongodb://localhost:27017/h-auth-test-db';

var options = {
  apiVersion: pkg.version,
  port: process.env.PORT || 4000,
  mongodbURI: TEST_DB_URI,
  secret: 'fake-secret',
};

// instantiate the app
var app = createHabemusAuth(options);

// create http server and pass express app as callback
var server = http.createServer(app);

function clearDb(callback) {   
  MongoClient.connect(TEST_DB_URI, function(err, db) {
    if(err) throw err;
    db.dropDatabase(callback);
  });
}

module.exports = {

  options: options,

  uri: 'http://localhost:' + options.port,

  start: function (cb) {

    clearDb(function (err) {
      if (err) {
        cb(err);
        return;
      }

      // start listening
      server.listen(options.port, function () {
        // console.log('HabemusAuth listening at port %s', options.port);

        cb();
      });
    });
  },

  stop: function (cb) {
    // start listening
    server.close(function () {
      // console.log('HabemusAuth stoppped');

      cb();
    });
  }

};