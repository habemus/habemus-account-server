// native dependencies
const assert = require('assert');

// third-party dependencies
const should = require('should');
const superagent = require('superagent');

// auxiliary
const aux = require('../auxiliary');

const hAccountApp = require('../../');

const REQUIRED_OPTIONS = {
  apiVersion: '0.0.0',
  mongodbURI: 'mongodb://localhost:27017/h-auth-test-db',
  rabbitMQURI: 'amqp://192.168.99.100',
  secret: 'fake-secret',
  
  fromEmail: 'from@dev.habem.us',
  hostURI: 'http://localhost:8000',
  uiHostURI: 'http://localhost:8000/ui'
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
      hAccountApp(options);
    });
  });

  it('should require mongodbURI', function () {
    var options = clone(REQUIRED_OPTIONS);
    delete options.mongodbURI;

    assert.throws(function () {
      hAccountApp(options);
    });
  });

  it('should require secret', function () {
    var options = clone(REQUIRED_OPTIONS);
    delete options.secret;

    assert.throws(function () {
      hAccountApp(options);
    });
  });

  it('should require fromEmail', function () {
    var options = clone(REQUIRED_OPTIONS);
    delete options.fromEmail;

    assert.throws(function () {
      hAccountApp(options);
    });
  });

  it('should instantiate an express app', function (done) {

    // allow greater timeout for rabbitMQ connection
    this.timeout(10000);

    var app = hAccountApp({
      apiVersion: '0.0.0',
      mongodbURI: 'mongodb://localhost:27017/h-auth-test-db',
      rabbitMQURI: 'amqp://192.168.99.100',
      secret: 'fake-secret',
      fromEmail: 'from@dev.habem.us',

      hostURI: 'http://localhost:8000',
      uiHostURI: 'http://localhost:8000/ui'
    });

    app.should.be.a.Function();

    // make sure the server responds to the /who route
    aux.startServer(4000, app)
      .then(() => {

        return app.ready;
      })
      .then(() => {
        superagent
          .get('http://localhost:4000/who')
          .end((err, res) => {
            res.statusCode.should.equal(200);

            res.body.data.name.should.equal('h-account');

            aux.teardown()
              .then(done);
          });
      })
      .catch(done);
  });

});