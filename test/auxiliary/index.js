// native dependencies
const path = require('path');
const http = require('http');

// third-party dependencies
const MongoClient   = require('mongodb').MongoClient;
const Bluebird      = require('bluebird');
const enableDestroy = require('server-destroy');

if (process.env.DEBUG === 'TRUE') {
  // set mongoose to debug mode
  require('mongoose').set('debug', true);
}

// constants
const TEST_DB_URI = 'mongodb://localhost:27017/h-auth-test-db';
const TEST_RABBIT_MQ_URI = 'amqp://localhost';

exports.dbURI = TEST_DB_URI;

exports.wait = function (ms) {
  return new Bluebird((resolve) => {
    setTimeout(resolve, ms);
  });
};

exports.defaultOptions = {
  apiVersion: '0.0.0',
  mongodbURI: TEST_DB_URI,
  rabbitMQURI: TEST_RABBIT_MQ_URI,
  authSecret: 'fake-secret',

  fromEmail: 'from@dev.habem.us',
  // publicHostURI: 'http://local.dev.h-account:4000',
  // uiHostURI: 'http://local.dev.h-account:4000/ui',
  publicHostURI: 'http://localhost:4000/public',
  uiHostURI: 'http://localhost:4000/public/ui',
};

exports.genOptions = function (opts) {
  return Object.assign({}, exports.defaultOptions, opts);
};

/**
 * Used to reject successful promises that should have not been fulfilled
 * @return {Bluebird Rejection}
 */
exports.errorExpected = function () {
  return Bluebird.reject(new Error('error expected'));
};

/**
 * Logs error and throws.
 * @param  {Error} err
 * @return {Error}
 */
exports.logError = function (err) {
  console.warn(err);
  throw err;
};

/**
 * Starts a server and keeps reference to it.
 * This reference will be used for teardown.
 */
exports.startServer = function (port, app) {

  if (!port) { throw new Error('port is required'); }
  if (!app) { throw new Error('app is required'); }

  // create http server and pass express app as callback
  var server = http.createServer(app);

  enableDestroy(server);

  return new Promise((resolve, reject) => {
    server.listen(port, () => {

      // register the server to be tore down
      exports.registerTeardown(function () {
        return new Promise((resolve, reject) => {
          server.destroy((err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        })
      });

      // resolve with the server
      resolve(server);
    });
  });
};

/**
 * Sets up an assets object that is ready for the tests
 * @return {[type]} [description]
 */
exports.setup = function () {

  var _assets = {
    dbURI: TEST_DB_URI,
    rabbitMQURI: TEST_RABBIT_MQ_URI,
  };

  return MongoClient.connect(TEST_DB_URI)
    .then((db) => {

      _assets.db = db;

      // register database teardown
      exports.registerTeardown(function () {
        return _assets.db.dropDatabase().then(() => {
          return _assets.db.close();
        });
      });

      return _assets.db.dropDatabase();
    })
    .then((_res) => {
      return _assets;
    });
};

var TEARDOWN_CALLBACKS = [];

/**
 * Register a teardown function to be executed by the teardown
 * The function should return a promise
 */
exports.registerTeardown = function (teardown) {
  TEARDOWN_CALLBACKS.push(teardown);
};

/**
 * Executes all functions listed at TEARDOWN_CALLBACKS
 */
exports.teardown = function () {
  return Promise.all(TEARDOWN_CALLBACKS.map((fn) => {
    return fn();
  }))
  .then(() => {
    TEARDOWN_CALLBACKS = [];
  });
};

/**
 * Clones a given object
 */
exports.clone = function clone(obj) {
  var cloneObj = {};

  for (prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      cloneObj[prop] = obj[prop];
    }
  }

  return cloneObj;
}