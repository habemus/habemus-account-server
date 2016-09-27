/**
 * ATTENTION:
 * As this controller (protectedRequest) is not meant to be used
 * in a standalone fashion, but always in through calls
 * to `accVerificationCtrl` and `pwdResetCtrl`,
 * tests in this test script only test for
 * cases hard to test in the mentioned controllers.
 */

// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const Bluebird = require('bluebird');
const uuid = require('node-uuid');

// auxiliary
const aux = require('../../auxiliary');

const hAccount = require('../../../server');

describe('protectedRequestCtrl', function () {

  var ASSETS;

  beforeEach(function (done) {
    aux.setup()
      .then((assets) => {
        ASSETS = assets;

        var options = {
          apiVersion: '0.0.0',
          mongodbURI: assets.dbURI,
          rabbitMQURI: assets.rabbitMQURI,
          secret: 'fake-secret',

          fromEmail: 'from@dev.habem.us',

          host: 'http://localhost'
        };

        ASSETS.accountApp = hAccount(options);

        return ASSETS.accountApp.ready;
      })
      .then(() => {

        // create some users
        var create1 = ASSETS.accountApp.controllers.account.create({
          username: 'test-user-1',
          email: 'test-1@dev.habem.us',
          password: 'test-password',
        });
        var create2 = ASSETS.accountApp.controllers.account.create({
          username: 'test-user-2',
          email: 'test-2@dev.habem.us',
          password: 'test-password',
        });
        var create3 = ASSETS.accountApp.controllers.account.create({
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
    this.timeout(4000);
    aux.teardown().then(done).catch(done);
  });

  describe('create(userId, actionName, options)', function () {
    it('should require userId as the first argument', function () {
      return ASSETS.accountApp.controllers.protectedRequest
        .create(undefined, 'resetPassword')
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('userId');
          err.kind.should.equal('required');
        })
    });

    it('should require actionName as the second argument', function () {
      return ASSETS.accountApp.controllers.protectedRequest
        .create(uuid.v4(), undefined)
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('actionName');
          err.kind.should.equal('required');
        });
    });

    it('should require actionName to be either `resetPassword` or `verifyUserAccount`', function () {
      return ASSETS.accountApp.controllers.protectedRequest
        .create(uuid.v4(), 'someRandomAction')
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('actionName');
          err.kind.should.equal('unsupported');
        });
    });
  });

  describe('cancelUserRequests(userId, actionName, reason)', function () {
    it('should require userId as the first argument', function () {
      return ASSETS.accountApp.controllers.protectedRequest
        .cancelUserRequests(undefined, 'resetPassword', 'somereason')
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('userId');
          err.kind.should.equal('required');
        });
    });

    it('should require actionName as the second argument', function () {
      return ASSETS.accountApp.controllers.protectedRequest
        .cancelUserRequests(uuid.v4(), undefined, 'somereason')
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('actionName');
          err.kind.should.equal('required');
        });
    });

    it('should require reason as third argument', function () {
      return ASSETS.accountApp.controllers.protectedRequest
        .cancelUserRequests(uuid.v4(), 'resetPassword', undefined)
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('reason');
          err.kind.should.equal('required');
        });
    });
  });

  describe('verifyRequestConfirmationCode(userId, actionName, confirmationCode)', function () {
    it('should require userId as the first argument', function () {
      return ASSETS.accountApp.controllers.protectedRequest
        .verifyRequestConfirmationCode(undefined, 'resetPassword', 'CODE')
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('userId');
          err.kind.should.equal('required');
        });
    });

    it('should require actionName as the second argument', function () {
      return ASSETS.accountApp.controllers.protectedRequest
        .verifyRequestConfirmationCode(uuid.v4(), undefined, 'CODE')
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('actionName');
          err.kind.should.equal('required');
        });
    });

    it('should require confirmationCode as third argument', function () {
      return ASSETS.accountApp.controllers.protectedRequest
        .verifyRequestConfirmationCode(uuid.v4(), 'resetPassword', undefined)
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('confirmationCode');
          err.kind.should.equal('required');
        });
    });
  });
});
