// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const stubTransort = require('nodemailer-stub-transport');
const Bluebird = require('bluebird');

// auxiliary
const aux = require('../../auxiliary');

const createHAuth = require('../../../server');

function _wait(ms) {
  return new Bluebird((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

describe('accVerificationCtrl', function () {

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

        // expose options so that we can listen to
        // the stub nodemailer instance events
        ASSETS.options = options;

        ASSETS.authApp = createHAuth(options);

        done();
      })
      .catch(done);
  });

  afterEach(function (done) {
    aux.teardown().then(done).catch(done);
  });

  describe('verification request created upon user creation', function () {

    it('should be created once a user is created', function () {

      var _user;

      return ASSETS.authApp.controllers.user.create({
        username: 'test-user',
        email: 'test-user@dev.habem.us',
        password: 'test-password',
      })
      .then((user) => {
        _user = user;
        // check that a protected action request was created
        return Bluebird.resolve(ASSETS.authApp.models.ProtectedActionRequest.find());
      })
      .then((protectedActionRequests) => {
        protectedActionRequests.length.should.equal(1);

        var req = protectedActionRequests[0];

        req.userId.should.equal(_user._id);
        req.action.should.equal('verifyUserAccount');
        req.lockId.should.be.instanceof(String);
        req.expiresAt.should.be.instanceof(Date);
        req.createdAt.should.be.instanceof(Date);

        req.status.value.should.equal('pending');
        req.status.reason.should.equal('UserRequested');
      });
    });

    it('should be possible to verify the user account with the creation verification request', function () {

      var _userVerificationCode;
      var _user;

      // TODO: this is very hacky
      var confirmationCodeRe = /Your confirmation code is (.*?)\s/;

      // add listener to the log event of the node mailer stub transport
      ASSETS.options.nodemailerTransport.on('log', function (log) {
        if (log.type === 'message') {
          var match = log.message.match(confirmationCodeRe);
          if (match) {
            _userVerificationCode = match[1];
          }
        }
      });

      return ASSETS.authApp.controllers.user.create({
        username: 'test-user',
        email: 'test-user@dev.habem.us',
        password: 'test-password'
      })
      .then((user) => {

        _user = user;

        // wait 1000 just to ensure that _userVerificationCode is available
        return _wait(1000);
      })
      .then(() => {
        return ASSETS.authApp.controllers.accVerification
          .verifyUserAccount(_user._id, _userVerificationCode);
      })
      .then(() => {
        // check that the user's status
        // and the projetectedActionRequest have been updated
        var userQuery = ASSETS.authApp.controllers.user.getByUsername('test-user');
        var actionRequestQuery = ASSETS.authApp.models.ProtectedActionRequest.find();

        return Bluebird.all([
          userQuery,
          actionRequestQuery
        ])
      })
      .then((results) => {
        var user = results[0];
        var actionRequests = results[1];

        user.status.value.should.equal('active');

        actionRequests.length.should.equal(1);
        actionRequests[0].status.value.should.equal('fulfilled');
      })
      .catch((err) => {
        console.log(err);
        return Bluebird.reject(err);
      });

    });

    it('should fail verification upon providing wrong code', function () {

      return ASSETS.authApp.controllers.user.create({
        username: 'test-user',
        email: 'test-user@dev.habem.us',
        password: 'test-password'
      })
      .then((user) => {
        return ASSETS.authApp.controllers.accVerification
          .verifyUserAccount(user._id, 'WRONG_CODE');
      })
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidCredentials');
      });

    });

    it('should fail verification upon providing wrong userId', function () {

      var _userVerificationCode;
      var _user;

      // TODO: this is very hacky
      var confirmationCodeRe = /Your confirmation code is (.*?)\s/;

      // add listener to the log event of the node mailer stub transport
      ASSETS.options.nodemailerTransport.on('log', function (log) {
        if (log.type === 'message') {
          var match = log.message.match(confirmationCodeRe);
          if (match) {
            _userVerificationCode = match[1];
          }
        }
      });

      return ASSETS.authApp.controllers.user.create({
        username: 'test-user',
        email: 'test-user@dev.habem.us',
        password: 'test-password'
      })
      .then((user) => {

        _user = user;

        // wait 1000 just to ensure that _userVerificationCode is available
        return _wait(1000);
      })
      .then(() => {
        return ASSETS.authApp.controllers.accVerification
          .verifyUserAccount('some-wrong-user-id', _userVerificationCode);
      })
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidCredentials');
      });

    });
  });

  describe('createRequest(userId)', function () {

    beforeEach(function () {

      var create1 = ASSETS.authApp.controllers.user.create({
        username: 'test-user-1',
        email: 'test-user-1@dev.habem.us',
        password: 'test-password'
      });

      var create2 = ASSETS.authApp.controllers.user.create({
        username: 'test-user-2',
        email: 'test-user-2@dev.habem.us',
        password: 'test-password'
      });

      return Bluebird.all([
        create1,
        create2
      ])
      .then((users) => {
        ASSETS.users = users;
      });
    });

    it('should create a new verification request for the userId and cancel the previously created', function () {
      return ASSETS.authApp.controllers
        .accVerification.createRequest(ASSETS.users[0]._id)
        .then(() => {
          arguments.length.should.equal(0);

          // verify the request was created
          return ASSETS.authApp.models.ProtectedActionRequest.find({
            action: 'verifyUserAccount',
            userId: ASSETS.users[0]._id
          });
        })
        .then((protectedActionRequests) => {
          // there should be 2 action requests, one of them
          // cancelled and another active
          protectedActionRequests.length.should.equal(2);

          protectedActionRequests.filter(function (req) {
            return req.status.value === 'pending';
          }).length.should.equal(1);

          protectedActionRequests.filter(function (req) {
            return req.status.value === 'fulfilled';
          }).length.should.equal(0);

          protectedActionRequests.filter(function (req) {
            return req.status.value === 'cancelled';
          }).length.should.equal(1);

          // create yet another request, and check that previously generated requests
          // were cancelled
          return ASSETS.authApp.controllers
            .accVerification.createRequest(ASSETS.users[0]._id);
        })
        .then(() => {

          return ASSETS.authApp.models.ProtectedActionRequest.find({
            action: 'verifyUserAccount',
            userId: ASSETS.users[0]._id
          })
        })
        .then((protectedActionRequests) => {
          protectedActionRequests.length.should.equal(3);

          protectedActionRequests.filter(function (req) {
            return req.status.value === 'pending';
          }).length.should.equal(1);

          protectedActionRequests.filter(function (req) {
            return req.status.value === 'fulfilled';
          }).length.should.equal(0);

          protectedActionRequests.filter(function (req) {
            return req.status.value === 'cancelled';
          }).length.should.equal(2);
        });
    });
  });

  describe('verifyUserAccount(userId, confirmationCode)', function () {

    beforeEach(function () {

      var create1 = ASSETS.authApp.controllers.user.create({
        username: 'test-user-1',
        email: 'test-user-1@dev.habem.us',
        password: 'test-password'
      });

      var create2 = ASSETS.authApp.controllers.user.create({
        username: 'test-user-2',
        email: 'test-user-2@dev.habem.us',
        password: 'test-password'
      });

      return Bluebird.all([
        create1,
        create2
      ])
      .then((users) => {
        ASSETS.users = users;
      });
    });

    it('should change the user\'s status', function () {

      var _userVerificationCode;
      var _user;

      // TODO: this is very hacky
      var confirmationCodeRe = /Your confirmation code is (.*?)\s/;

      // add listener to the log event of the node mailer stub transport
      ASSETS.options.nodemailerTransport.on('log', function (log) {
        if (log.type === 'message') {
          var match = log.message.match(confirmationCodeRe);
          if (match) {
            _userVerificationCode = match[1];
          }
        }
      });

      // create a new user so that we can
      // sniff the verification code
      return ASSETS.authApp.controllers.user.create({
        username: 'test-user-3',
        email: 'test-user-3@dev.habem.us',
        password: 'test-password'
      })
      .then((user) => {

        _user = user;

        // wait 1000 just to ensure that _userVerificationCode is available
        return _wait(1000);
      })
      .then(() => {
        return ASSETS.authApp.controllers.accVerification
          .verifyUserAccount(_user._id, _userVerificationCode);
      })
      .then(() => {
        // refetch user's data
        return ASSETS.authApp.controllers.user.getByUsername(_user.username);
      })
      .then((user) => {
        user.status.value.should.equal('active');
      });
    })
  });
});
