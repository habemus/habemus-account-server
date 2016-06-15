// native dependencies
const assert = require('assert');

// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const stubTransort = require('nodemailer-stub-transport');

// auxiliary
const aux = require('../auxiliary');

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


  it('should require fromEmail', function () {
    var options = clone(REQUIRED_OPTIONS);
    delete options.fromEmail;

    assert.throws(function () {
      createHAuthApp(options);
    });
  });

  it('should instantiate an express app', function (done) {
    var app = createHAuthApp({
      apiVersion: '0.0.0',
      mongodbURI: 'mongodb://localhost:27017/h-auth-test-db',
      secret: 'fake-secret',
      nodemailerTransport: stubTransort(),
      fromEmail: 'from@dev.habem.us',

      host: 'http://localhost'
    });

    app.should.be.a.Function();

    // make sure the server responds to the /who route
    aux.startServer(4000, app)
      .then(() => {
        superagent
          .get('http://localhost:4000/who')
          .end((err, res) => {
            res.statusCode.should.equal(200);

            res.body.data.name.should.equal('h-auth');

            aux.teardown()
              .then(done);
          });
      });
  });

});