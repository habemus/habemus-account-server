// native dependencies
const assert = require('assert');

// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const stubTransort = require('nodemailer-stub-transport');

// testServer
const testServer = require('../auxiliary/server');

const createHAuthApp = require('../../');

const REQUIRED_OPTIONS = {
  apiVersion: '0.0.0',
  mongodbURI: 'mongodb://localhost:27017/h-auth-test-db',
  secret: 'fake-secret',

  nodemailerTransport: stubTransort(),
  fromEmail: 'from@dev.habem.us',

  host: 'http://localhost'
};

function clone(obj) {
  var cloneObj = {};

  for (prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      cloneObj[prop] = obj[prop];
    }
  }

  return cloneObj;
}

describe('server initialization', function () {

  it('should require apiVersion option', function () {
    var options = clone(REQUIRED_OPTIONS);
    delete options.apiVersion;

    assert.throws(function () {
      createHAuthApp(options);
    });
  });

  it('should require mongodbURI', function () {
    var options = clone(REQUIRED_OPTIONS);
    delete options.mongodbURI;

    assert.throws(function () {
      createHAuthApp(options);
    });
  });

  it('should require secret', function () {
    var options = clone(REQUIRED_OPTIONS);
    delete options.secret;

    assert.throws(function () {
      createHAuthApp(options);
    });
  });

  it('should require host', function () {
    var options = clone(REQUIRED_OPTIONS);
    delete options.host;

    assert.throws(function () {
      createHAuthApp(options);
    });
  });

  it('should require nodemailerTransport', function () {
    var options = clone(REQUIRED_OPTIONS);
    delete options.nodemailerTransport;

    assert.throws(function () {
      createHAuthApp(options);
    });
  });

  it('should instantiate an express app', function () {
    var app = createHAuthApp({
      apiVersion: '0.0.0',
      mongodbURI: 'mongodb://localhost:27017/h-auth-test-db',
      secret: 'fake-secret',
      nodemailerTransport: stubTransort(),
      fromEmail: 'from@dev.habem.us',

      host: 'http://localhost'
    });

    app.should.be.a.Function();
  });

  it('should have a route that describes the api', function (done) {

    testServer.start(function () {

      superagent
        .get(testServer.uri + '/who')
        .end(function (err, res) {

          if (err) {
            return done(err);
          }

          res.statusCode.should.equal(200);
          res.body.data.name.should.equal('h-auth');

          testServer.stop(done);
        });

    });
  });

});