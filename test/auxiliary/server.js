// native dependencies
const path = require('path');
const http = require('http');

// third-party dependencies
const MongoClient = require('mongodb').MongoClient;
const stubTransport = require('nodemailer-stub-transport');


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

  nodemailerTransport: stubTransport(),
  senderEmail: 'test@dev.habem.us',
};

// set the host
options.host = 'http://localhost:' + options.port;

// set mongoose to debug mode
require('mongoose').set('debug', true);

module.exports = {
  options: options,

  uri: 'http://localhost:' + options.port,

  collections: {},

  db: undefined,

  start: function (cb) {

    // connect
    MongoClient.connect(TEST_DB_URI)
      .then((db) => {
        // setup database for tests

        // set reference to the database
        this.db = db;

        var dropPromise = db.dropDatabase();

        return Promise.all([dropPromise])
      })
      .then(() => {

        try {

          // IMPORTANT!
          // instantiate the app only after the database has been dropped
          // to avoid weird behaviors
          var app = createHabemusAuth(options);
        } catch (e) {

          console.log(e);

          cb(e);
          return;
        }

        // create http server and pass express app as callback
        var server = this.server = http.createServer(app);

        // start listening
        server.listen(options.port, () => {
          // console.log('HabemusAuth listening at port %s', options.port);

          // setTimeout(cb, 1000);
          cb();
        });
      })
      .catch(cb);
  },

  stop: function (cb) {
    // start listening
    this.server.close(() => {
      // console.log('HabemusAuth stoppped');

      this.db.dropDatabase()
        .then(() => {
          this.db.close(true, cb);
        })
    });
  },
};