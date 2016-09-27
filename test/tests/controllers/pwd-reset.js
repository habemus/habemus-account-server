// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const stubTransort = require('nodemailer-stub-transport');
const Bluebird = require('bluebird');

// auxiliary
const aux = require('../../auxiliary');

const hAccount = require('../../../server');

function _wait(ms) {
  return new Bluebird((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

describe('pwdResetCtrl', function () {

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

        ASSETS.accountApp = hAccount(options);

        // create some users
        var create1 = ASSETS.accountApp.controllers.user.create({
          username: 'test-user-1',
          email: 'test-1@dev.habem.us',
          password: 'test-password-1',
        });
        var create2 = ASSETS.accountApp.controllers.user.create({
          username: 'test-user-2',
          email: 'test-2@dev.habem.us',
          password: 'test-password-2',
        });
        var create3 = ASSETS.accountApp.controllers.user.create({
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

  describe('createRequest(username)', function () {
    it('should create a `resetPassword` protectedActionRequest', function () {
      return ASSETS.accountApp.controllers.pwdReset
        .createRequest('test-user-1')
        .then(() => {
          arguments.length.should.equal(0);

          // check that it is still possible to login
          // using old password
          return ASSETS.accountApp.controllers.auth
            .generateToken('test-user-1', 'test-password-1');
        })
        .then((token) => {
          should(token).be.instanceof(String);

          // check that a protectedActionRequest database entry was registered
          return ASSETS.accountApp.models.ProtectedActionRequest.find({
            action: 'resetPassword',
            userId: ASSETS.users[0]._id,
          });
        })
        .then((reqs) => {
          reqs.length.should.equal(1);
          reqs[0].status.value.should.equal('pending');
        });
    });

    it('should require username to be passed as first argument', function () {
      return ASSETS.accountApp.controllers.pwdReset
        .createRequest(undefined)
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('username');
          err.kind.should.equal('required');
        });
    });

    it('should fail to create a request for a user that does not exist', function () {
      return ASSETS.accountApp.controllers.pwdReset
        .createRequest('fake-user')
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('UserNotFound');
          err.identifier.should.equal('fake-user');
        });
    });
  });

  describe('resetPassword(username, confirmationCode, password)', function () {
    it('should reset the password', function () {

      // it is a rather long sequence
      this.timeout(4000);

      var _passwordResetCode;

      // TODO: this is very hacky
      var confirmationCodeRe = /To reset your password, please enter the code (.*?)\s/;

      // add listener to the log event of the node mailer stub transport
      ASSETS.options.nodemailerTransport.on('log', function (log) {
        if (log.type === 'message') {
          var match = log.message.match(confirmationCodeRe);
          if (match) {
            _passwordResetCode = match[1];
          }
        }
      });

      return ASSETS.accountApp.controllers.pwdReset.createRequest('test-user-1')
        .then(() => {
          // wait 1000 just to ensure that _passwordResetCode is available
          return _wait(1000);
        })
        .then(() => {
          return ASSETS.accountApp.controllers.pwdReset
            .resetPassword('test-user-1', _passwordResetCode, 'new-test-user-1-password');
        })
        .then(() => {
          // generate auth token using new password
          // and query for protectedActionRequests
          var genToken = ASSETS.accountApp.controllers.auth.generateToken(
            'test-user-1',
            'new-test-user-1-password'
          );
          var actionRequestQuery = ASSETS.accountApp.models.ProtectedActionRequest.find({
            userId: ASSETS.users[0]._id,
            action: 'resetPassword',
          });

          return Bluebird.all([
            genToken,
            actionRequestQuery
          ])
        })
        .then((results) => {
          var token = results[0];
          var actionRequests = results[1];

          should(token).be.instanceof(String);

          actionRequests.length.should.equal(1);
          actionRequests[0].status.value.should.equal('fulfilled');
        });
    });
    
    it('should fail to reset the password if there is no corresponding request', function () {
      return ASSETS.accountApp.controllers.pwdReset
        .resetPassword('test-user-1', '123456', 'new-password')
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidCredentials');

          // login with original password
          return ASSETS.accountApp.controllers.auth.generateToken('test-user-1', 'test-password-1');
        })
        .then((token) => {
          should(token).be.instanceof(String);
        });
    });

    it('should fail to reset the password if the confirmationCode is incorrect', function () {
      return ASSETS.accountApp.controllers.pwdReset.createRequest('test-user-1')
        .then(() => {
          return ASSETS.accountApp.controllers.pwdReset
            .resetPassword('test-user-1', 'obviously-wrong-code', 'new-1-password');
        })
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidCredentials');

          console.log(err);

          // login with original password
          return ASSETS.accountApp.controllers.auth
            .generateToken('test-user-1', 'test-password-1');
        })
        .then((token) => {
          should(token).be.instanceof(String);
        });
    });

    it('should require username to be passed as first argument', function () {
      return ASSETS.accountApp.controllers.pwdReset
        .resetPassword(undefined, '123456', 'new-password')
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('username');
          err.kind.should.equal('required');
        });
    });

    it('should require confirmationCode to be passed as second argument', function () {
      return ASSETS.accountApp.controllers.pwdReset
        .resetPassword('test-user-1', undefined, 'new-password')
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('confirmationCode');
          err.kind.should.equal('required');
        });
    });

    it('should require password to be passed as third argument', function () {
      return ASSETS.accountApp.controllers.pwdReset
        .resetPassword('test-user-1', '123456', undefined)
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('password');
          err.kind.should.equal('required');
        });
    });
  });
});
