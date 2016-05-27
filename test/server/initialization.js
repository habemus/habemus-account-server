// native dependencies
const assert = require('assert');

// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const stubTransort = require('nodemailer-stub-transport');

// testServer
const testServer = require('../auxiliary/server');

const createHAuthApp = require('../../');

describe('server initialization', function () {

  it('should require apiVersion option', function () {
    assert.throws(function () {
      createHAuthApp({
        // apiVersion: '0.0.0',
        mongodbURI: 'mongodb://localhost:27017/h-auth-test-db',
        secret: 'fake-secret',

        nodemailerTransport: stubTransort(),
        fromEmail: 'from@dev.habem.us',

        host: 'http://localhost'
      });
    });
  });

  it('should require mongodbURI', function () {
    assert.throws(function () {
      createHAuthApp({
        apiVersion: '0.0.0',
        // mongodbURI: 'mongodb://localhost:27017/h-auth-test-db',
        secret: 'fake-secret',

        nodemailerTransport: stubTransort(),
        fromEmail: 'from@dev.habem.us',

        host: 'http://localhost'
      });
    });
  });

  it('should require secret', function () {
    assert.throws(function () {
      createHAuthApp({
        apiVersion: '0.0.0',
        mongodbURI: 'mongodb://localhost:27017/h-auth-test-db',
        // secret: 'fake-secret',
        // 

        nodemailerTransport: stubTransort(),
        fromEmail: 'from@dev.habem.us',

        host: 'http://localhost'
      });
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