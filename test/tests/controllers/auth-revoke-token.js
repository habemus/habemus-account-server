// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const Bluebird = require('bluebird');
const jwt = require('jsonwebtoken');

// auxiliary
const aux = require('../../auxiliary');

const hAccount = require('../../../server');

describe('authCtrl.revokeToken(token)', function () {

  var ASSETS;

  beforeEach(function (done) {
    aux.setup()
      .then((assets) => {
        ASSETS = assets;

        ASSETS.accountApp = hAccount(aux.genOptions());

        return ASSETS.accountApp.ready;
      })
      .then(() => {

        // create some users
        var create1 = ASSETS.accountApp.controllers.account.create({
          username: 'test-user-1',
          email: 'test-1@dev.habem.us',
          password: 'test-password-1',
        });
        var create2 = ASSETS.accountApp.controllers.account.create({
          username: 'test-user-2',
          email: 'test-2@dev.habem.us',
          password: 'test-password-2',
        });
        var create3 = ASSETS.accountApp.controllers.account.create({
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

  afterEach(function () {
    this.timeout(5000);
    return aux.teardown();
  });

  it('should revoke a token, invalidating it for further requests', function () {

    var _token;

    return ASSETS.accountApp.controllers.auth
      .generateToken('test-user-1', 'test-password-1')
      .then((token) => {
        _token = token;

        var decoded = jwt.decode(token);

        return ASSETS.accountApp.controllers.auth.revokeToken(decoded.jti);
      })
      .then(() => {
        arguments.length.should.equal(0);

        // attempting to use revoked token should result in error
        return ASSETS.accountApp.controllers.auth.decodeToken(_token);
      })
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidToken');
      });
  });

  it('should require tokenId to be passed as the first argument', function () {
    return ASSETS.accountApp.controllers.auth.revokeToken(undefined)
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidOption');
        err.option.should.equal('tokenId');
        err.kind.should.equal('required');
      });
  });
});
