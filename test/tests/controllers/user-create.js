// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const stubTransort = require('nodemailer-stub-transport');

// auxiliary
const aux = require('../../auxiliary');

const createHAuth = require('../../../server');

describe('userCtrl.create(userData)', function () {

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

        done();
      })
      .catch(done);
  });

  afterEach(function (done) {
    aux.teardown().then(done).catch(done);
  });

  it('should create a user', function () {
      
    return ASSETS.authApp.controllers.user.create({
      username: 'test-user',
      password: 'test-password',
      email: 'test-user@dev.habem.us',
    })
    .then((user) => {

      user.createdAt.should.be.instanceof(Date);
      user.status.value.should.equal('unverified');

      user.username.should.equal('test-user');
      user.email.should.equal('test-user@dev.habem.us');

      // rough test checking if the user's password is stored in the db
      var pwdMatch = JSON.stringify(user).match(/test-password/);

      if (pwdMatch) {
        throw new Error('password found in user data');
      }
    });
  });

  it('should require username', function () {
    return ASSETS.authApp.controllers.user.create({
      // username: 'test-user',
      password: 'test-password',
      email: 'test-user@dev.habem.us',
    })
    .then(aux.errorExpected, (err) => {
      err.name.should.equal('InvalidOption');
      err.option.should.equal('username');
      err.kind.should.equal('required');
    });
  });

  it('should require a password', function () {
    return ASSETS.authApp.controllers.user.create({
      username: 'test-user',
      // password: 'test-password',
      email: 'test-user@dev.habem.us',
    })
    .then(aux.errorExpected, (err) => {
      err.name.should.equal('InvalidOption');
      err.option.should.equal('password');
      err.kind.should.equal('required');
    });
  });

  it('should require an email', function () {
    return ASSETS.authApp.controllers.user.create({
      username: 'test-user',
      password: 'test-password',
      // email: 'test-user@dev.habem.us',
    })
    .then(aux.errorExpected, (err) => {
      err.name.should.equal('InvalidOption');
      err.option.should.equal('email');
      err.kind.should.equal('required');
    });
  });

  it('should prevent creation of an account with duplicate username', function () {
      
    return ASSETS.authApp.controllers.user.create({
      username: 'test-user',
      password: 'test-password',
      email: 'test-user@dev.habem.us',
    })
    .then((user) => {
      return ASSETS.authApp.controllers.user.create({
        username: 'test-user',
        password: 'another-password',
        email: 'another-email-user@dev.habem.us',
      })
    })
    .then(aux.errorExpected, (err) => {
      err.name.should.equal('UsernameTaken');
      err.username.should.equal('test-user');
    });
  });

  it('should prevent creation of an account with duplicate email', function () {
      
    return ASSETS.authApp.controllers.user.create({
      username: 'test-user',
      password: 'test-password',
      email: 'test-user@dev.habem.us',
    })
    .then((user) => {
      return ASSETS.authApp.controllers.user.create({
        username: 'another-user',
        password: 'another-password',
        email: 'test-user@dev.habem.us',
      })
    })
    .then(aux.errorExpected, (err) => {
      err.name.should.equal('EmailTaken');
      err.email.should.equal('test-user@dev.habem.us');
    });
  });
    
});
