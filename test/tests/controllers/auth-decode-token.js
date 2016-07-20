// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const stubTransort = require('nodemailer-stub-transport');
const Bluebird = require('bluebird');
const jwt = require('jsonwebtoken');

// auxiliary
const aux = require('../../auxiliary');

const createHAuth = require('../../../server');

describe('authCtrl.decodeToken(token)', function () {

  var ASSETS;

  beforeEach(function (done) {
    aux.setup()
      .then((assets) => {
        ASSETS = assets;

        var options = {
          apiVersion: '0.0.0',
          mongodbURI: assets.dbURI,
          secret: 'fake-secret',

          nodemailerTransport: stubTransort(),
          fromEmail: 'from@dev.habem.us',

          host: 'http://localhost'
        };

        ASSETS.authApp = createHAuth(options);

        // create some users
        var create1 = ASSETS.authApp.controllers.user.create({
          username: 'test-user-1',
          email: 'test-1@dev.habem.us',
          password: 'test-password-1',
        });
        var create2 = ASSETS.authApp.controllers.user.create({
          username: 'test-user-2',
          email: 'test-2@dev.habem.us',
          password: 'test-password-2',
        });
        var create3 = ASSETS.authApp.controllers.user.create({
          username: 'test-user-3',
          email: 'test-3@dev.habem.us',
          password: 'test-password-3',
        });

        return Bluebird.all([
          create1,
          create2,
          create3
        ]);
        
      })
      .then(() => {

        done();
      })
      .catch(done);
  });

  afterEach(function (done) {
    aux.teardown().then(done).catch(done);
  });

  it('should verify validity of a token and return its decoded contents', function () {
    return ASSETS.authApp.controllers.auth
      .generateToken('test-user-1', 'test-password-1')
      .then((token) => {
        return ASSETS.authApp.controllers.auth
          .decodeToken(token);
      })
      .then((decoded) => {
        Object.keys(decoded).length.should.equal(6);

        decoded.createdAt.should.be.instanceof(String);
        decoded.iat.should.be.instanceof(Number);
        decoded.exp.should.be.instanceof(Number);
        decoded.iss.should.equal('h-auth');
        // sub should be equal to the username
        decoded.sub.should.equal('test-user-1');
        decoded.jti.should.be.instanceof(String);
      });
  });

  it('should fail to verify validity of a forged token', function () {

    var forgedToken = jwt.sign({}, 'forged-fake-secret', {
      expiresIn: '10h',
      issuer: 'h-auth',
      subject: 'test-user-1'
    });

    return ASSETS.authApp.controllers.auth
      .decodeToken(forgedToken)
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidToken');
      });
  });

  it('should require the token to be passed as first argument', function () {
    return ASSETS.authApp.controllers.auth.decodeToken(undefined)
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidOption');
        err.option.should.equal('token');
        err.kind.should.equal('required');
      });
  });
});
