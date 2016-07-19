// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const stubTransort = require('nodemailer-stub-transport');
const Bluebird = require('bluebird');

// auxiliary
const aux = require('../../auxiliary');

const createHAuth = require('../../../server');

describe('userCtrl `get` methods', function () {

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
          password: 'test-password',
        });
        var create2 = ASSETS.authApp.controllers.user.create({
          username: 'test-user-2',
          email: 'test-2@dev.habem.us',
          password: 'test-password',
        });
        var create3 = ASSETS.authApp.controllers.user.create({
          username: 'test-user-3',
          email: 'test-3@dev.habem.us',
          password: 'test-password',
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

  describe('userCtrl.getByUsername(username)', function () {
    it('should retrieve the user by its username', function () {
      return ASSETS.authApp.controllers.user.getByUsername('test-user-1')
        .then((user) => {
          user.username.should.equal('test-user-1');
          user.email.should.equal('test-1@dev.habem.us');
        });
    });

    it('should return error if username does not exist', function () {
      return ASSETS.authApp.controllers.user.getByUsername('fake-username')
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('UserNotFound');
          err.identifier.should.equal('fake-username');
        });
    });

    it('should require username as first argument', function () {
      return ASSETS.authApp.controllers.user.getByUsername(undefined)
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('username');
          err.kind.should.equal('required');
        });
    });
  });

  describe('userCtrl.getByEmail(email)', function () {
    it('should retrieve the user by its username', function () {
      return ASSETS.authApp.controllers.user.getByEmail('test-2@dev.habem.us')
        .then((user) => {
          user.username.should.equal('test-user-2');
          user.email.should.equal('test-2@dev.habem.us');
        });
    });

    it('should return error if email does not exist', function () {
      return ASSETS.authApp.controllers.user.getByUsername('fake-email@dev.habem.us')
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('UserNotFound');
          err.identifier.should.equal('fake-email@dev.habem.us');
        });
    });


    it('should require email as first argument', function () {
      return ASSETS.authApp.controllers.user.getByEmail(undefined)
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('email');
          err.kind.should.equal('required');
        });
    });
  });
    
});
