// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const stubTransort = require('nodemailer-stub-transport');
const Bluebird = require('bluebird');
const jwt = require('jsonwebtoken');

// auxiliary
const aux = require('../../auxiliary');

const createHAuth = require('../../../server');

describe('authCtrl.revokeToken(token)', function () {

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

  it('should revoke a token, invalidating it for further requests', function () {

    var _token;

    return ASSETS.authApp.controllers.auth
      .generateToken('test-user-1', 'test-password-1')
      .then((token) => {
        _token = token;

        var decoded = jwt.decode(token);

        return ASSETS.authApp.controllers.auth.revokeToken(decoded.jti);
      })
      .then(() => {
        arguments.length.should.equal(0);

        // attempting to use revoked token should result in error
        return ASSETS.authApp.controllers.auth.decodeToken(_token);
      })
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidToken');
      });
  });

  it('should require tokenId to be passed as the first argument', function () {
    return ASSETS.authApp.controllers.auth.revokeToken(undefined)
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidOption');
        err.option.should.equal('tokenId');
        err.kind.should.equal('required');
      });
  });
});
