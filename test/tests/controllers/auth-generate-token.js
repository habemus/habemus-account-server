// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const Bluebird = require('bluebird');
const jwt = require('jsonwebtoken');

// auxiliary
const aux = require('../../auxiliary');

const hAccount = require('../../../server');

describe('authCtrl.generateToken(username|email, password)', function () {

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
      .then((users) => {

        ASSETS.users = users;

        done();
      })
      .catch(done);
  });

  afterEach(function (done) {
    aux.teardown().then(done).catch(done);
  });

  it('should generate the token using username and password', function () {
    return ASSETS.accountApp.controllers.auth
      .generateToken('test-user-1', 'test-password-1')
      .then((token) => {
        token.should.be.instanceof(String);
      });
  });

  it('should generate the token using email and password', function () {
    return ASSETS.accountApp.controllers.auth
      .generateToken('test-1@dev.habem.us', 'test-password-1')
      .then((token) => {
        token.should.be.instanceof(String);
      });
  });

  it('should error upon using wrong password for username', function () {
    return ASSETS.accountApp.controllers.auth
      .generateToken('test-user-1', 'test-password-2')
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidCredentials');
      });
  });

  it('should error upon using wrong password for email', function () {
    return ASSETS.accountApp.controllers.auth
      .generateToken('test-1@dev.habem.us', 'test-password-2')
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidCredentials');
      });
  });

  it('should error upon using username that does not exist', function () {
    return ASSETS.accountApp.controllers.auth
      .generateToken('random-username', 'test-password-1')
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidCredentials');
      });
  });

  it('should error upon using email that does not exist', function () {
    return ASSETS.accountApp.controllers.auth
      .generateToken('fake@email.com', 'test-password-1')
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidCredentials');
      });
  });

  it('should require usernameOrEmail as the first argument', function () {
    return ASSETS.accountApp.controllers.auth
      .generateToken(undefined, 'test-password-1')
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidOption');
        err.option.should.equal('usernameOrEmail');
        err.kind.should.equal('required');
      });
  });

  it('should require password as the second argument', function () {
    return ASSETS.accountApp.controllers.auth
      .generateToken('test-user-1', undefined)
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidOption');
        err.option.should.equal('password');
        err.kind.should.equal('required');
      });
  });

  it('should generate a valid jwt token', function () {
    return ASSETS.accountApp.controllers.auth
      .generateToken('test-user-3', 'test-password-3')
      .then((token) => {
        var decoded = jwt.decode(token);

        Object.keys(decoded).length.should.equal(8);

        decoded.createdAt.should.be.instanceof(String);
        decoded.username.should.equal('test-user-3');

        decoded.status.value.should.eql('unverified');
        
        decoded.iat.should.be.instanceof(Number);
        decoded.exp.should.be.instanceof(Number);
        decoded.iss.should.equal('h-account');
        // sub should be equal to the username
        decoded.sub.should.equal(ASSETS.users[2]._id);
        decoded.jti.should.be.instanceof(String);
      });
  });
});
