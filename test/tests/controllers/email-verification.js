// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const Bluebird = require('bluebird');
const mockery  = require('mockery');

// auxiliary
const aux = require('../../auxiliary');

const hAccount = require('../../../server');

function _wait(ms) {
  return new Bluebird((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

describe('emailVerificationCtrl', function () {

  var ASSETS;

  beforeEach(function () {

    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    // mock h-mailer/client
    function HMailerClient() {}
    HMailerClient.prototype.connect = function () {
      return Bluebird.resolve();
    };
    HMailerClient.prototype.schedule = function (data) {

      // make the mail schedule data available
      // on ASSETS object
      ASSETS.scheduledMail = data;

      // console.log('SCHEDULED MAIL:', data);
    };
    HMailerClient.prototype.on = function () {};
    mockery.registerMock('h-mailer/client', HMailerClient);

    return aux.setup()
      .then((assets) => {
        ASSETS = assets;

        ASSETS.accountApp = hAccount(aux.genOptions());

        return ASSETS.accountApp.ready;
      });
  });

  afterEach(function () {
    this.timeout(5000);
    mockery.disable();
    
    return aux.teardown();
  });

  describe('verification request created upon user creation', function () {

    it('should be created once a user is created', function () {

      var _user;

      return ASSETS.accountApp.controllers.account.create({
        username: 'test-user',
        email: 'test-user@dev.habem.us',
        password: 'test-password',
        ownerData: {
          givenName: 'João',
          familyName: 'Sauro',
        },
        legal: {
          termsOfService: {
            agreed: true,
          }
        }
      })
      .then((user) => {
        _user = user;
        // check that a protected action request was created
        return Bluebird.resolve(ASSETS.accountApp.services.mongoose.models.ProtectedActionRequest.find());
      })
      .then((protectedActionRequests) => {
        protectedActionRequests.length.should.equal(1);

        var req = protectedActionRequests[0];

        req.userId.should.equal(_user._id);
        req.action.should.equal('verifyAccountEmail');
        req.lockId.should.be.instanceof(String);
        req.expiresAt.should.be.instanceof(Date);
        req.createdAt.should.be.instanceof(Date);

        req.status.value.should.equal('pending');
        req.status.reason.should.equal('UserRequested');
      });
    });

    it('should be possible to verify the user account with the creation verification request', function () {

      // rather long sequence
      this.timeout(10000);

      var _userVerificationCode;
      var _user;

      return ASSETS.accountApp.controllers.account.create({
        username: 'test-user',
        email: 'test-user@dev.habem.us',
        password: 'test-password',
        ownerData: {
          givenName: 'João',
          familyName: 'Sauro',
        },
        legal: {
          termsOfService: {
            agreed: true,
          }
        }
      })
      .then((user) => {

        _user = user;

        // wait 1000 just to ensure that _userVerificationCode is available
        return _wait(1000);
      })
      .then(() => {

        // user verification code should be availabe at the assets object
        _userVerificationCode = ASSETS.scheduledMail.data.code;

        return ASSETS.accountApp.controllers.emailVerification
          .verifyAccountEmail('test-user', _userVerificationCode);
      })
      .then(() => {
        // check that the user's status
        // and the projetectedActionRequest have been updated
        var userQuery = ASSETS.accountApp.controllers.account.getByUsername('test-user');
        var actionRequestQuery = ASSETS.accountApp.services.mongoose.models.ProtectedActionRequest.find();

        return Bluebird.all([
          userQuery,
          actionRequestQuery
        ])
      })
      .then((results) => {
        var user = results[0];
        var actionRequests = results[1];

        user.status.value.should.equal('verified');

        actionRequests.length.should.equal(1);
        actionRequests[0].status.value.should.equal('fulfilled');
      })
      .catch(aux.logError);

    });

    it('should fail verification upon providing wrong code', function () {

      return ASSETS.accountApp.controllers.account.create({
        username: 'test-user',
        email: 'test-user@dev.habem.us',
        password: 'test-password',
        ownerData: {
          givenName: 'João',
          familyName: 'Sauro',
        },
        legal: {
          termsOfService: {
            agreed: true,
          }
        }
      })
      .then((user) => {
        return ASSETS.accountApp.controllers.emailVerification
          .verifyAccountEmail('test-user', 'WRONG_CODE');
      })
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidCredentials');
      });

    });

    it('should fail verification upon providing wrong userId', function () {

      var _userVerificationCode;
      var _user;

      return ASSETS.accountApp.controllers.account.create({
        username: 'test-user',
        email: 'test-user@dev.habem.us',
        password: 'test-password',
        ownerData: {
          givenName: 'João',
          familyName: 'Sauro',
        },
        legal: {
          termsOfService: {
            agreed: true,
          }
        }
      })
      .then((user) => {

        _user = user;

        // wait 1000 just to ensure that _userVerificationCode is available
        return _wait(1000);
      })
      .then(() => {

        _userVerificationCode = ASSETS.scheduledMail.data.code;

        return ASSETS.accountApp.controllers.emailVerification
          .verifyAccountEmail('wrong-username', _userVerificationCode);
      })
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidCredentials');
      });

    });
  });

  describe('createRequest(username)', function () {

    beforeEach(function () {

      var create1 = ASSETS.accountApp.controllers.account.create({
        username: 'test-user-1',
        email: 'test-user-1@dev.habem.us',
        password: 'test-password',
        ownerData: {
          givenName: 'João',
          familyName: 'Sauro',
        },
        legal: {
          termsOfService: {
            agreed: true,
          }
        }
      });

      var create2 = ASSETS.accountApp.controllers.account.create({
        username: 'test-user-2',
        email: 'test-user-2@dev.habem.us',
        password: 'test-password',
        ownerData: {
          givenName: 'João',
          familyName: 'Sauro',
        },
        legal: {
          termsOfService: {
            agreed: true,
          }
        }
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
      return ASSETS.accountApp.controllers
        .emailVerification.createRequest(ASSETS.users[0].username)
        .then(() => {
          arguments.length.should.equal(0);

          // verify the request was created
          return ASSETS.accountApp.services.mongoose.models.ProtectedActionRequest.find({
            action: 'verifyAccountEmail',
            userId: ASSETS.users[0]._id
          });
        })
        .then((protectedActionRequests) => {
          // there should be 2 action requests, one of them
          // cancelled and another verified
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
          return ASSETS.accountApp.controllers
            .emailVerification.createRequest(ASSETS.users[0].username);
        })
        .then(() => {

          return ASSETS.accountApp.services.mongoose.models.ProtectedActionRequest.find({
            action: 'verifyAccountEmail',
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

    it('should require username as the first argument', function () {
      return ASSETS.accountApp.controllers.emailVerification.createRequest(undefined)
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('username')
          err.kind.should.equal('required');
        });
    });
  });

  describe('verifyAccountEmail(username, confirmationCode)', function () {

    beforeEach(function () {

      var create1 = ASSETS.accountApp.controllers.account.create({
        username: 'test-user-1',
        email: 'test-user-1@dev.habem.us',
        password: 'test-password',
        ownerData: {
          givenName: 'João',
          familyName: 'Sauro',
        },
        legal: {
          termsOfService: {
            agreed: true,
          }
        }
      });

      var create2 = ASSETS.accountApp.controllers.account.create({
        username: 'test-user-2',
        email: 'test-user-2@dev.habem.us',
        password: 'test-password',
        ownerData: {
          givenName: 'João',
          familyName: 'Sauro',
        },
        legal: {
          termsOfService: {
            agreed: true,
          }
        }
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

      // create a new user so that we can
      // sniff the verification code
      return ASSETS.accountApp.controllers.account.create({
        username: 'test-user-3',
        email: 'test-user-3@dev.habem.us',
        password: 'test-password',
        ownerData: {
          givenName: 'João',
          familyName: 'Sauro',
        },
        legal: {
          termsOfService: {
            agreed: true,
          }
        }
      })
      .then((user) => {

        _user = user;

        // wait 1000 just to ensure that _userVerificationCode is available
        return _wait(1000);
      })
      .then(() => {

        _userVerificationCode = ASSETS.scheduledMail.data.code;

        return ASSETS.accountApp.controllers.emailVerification
          .verifyAccountEmail(_user.username, _userVerificationCode);
      })
      .then(() => {
        // refetch user's data
        // and query for protectedActionRequests
        var userQuery = ASSETS.accountApp.controllers.account.getByUsername(_user.username);
        var actionRequestQuery = ASSETS.accountApp.services.mongoose.models.ProtectedActionRequest.find({
          userId: _user._id
        });

        return Bluebird.all([
          userQuery,
          actionRequestQuery
        ])
      })
      .then((results) => {
        var user = results[0];
        var actionRequests = results[1];

        user.status.value.should.equal('verified');
        actionRequests.length.should.equal(1);

        actionRequests[0].status.value.should.equal('fulfilled');
      });
    });

    it('should require username as the first argument', function () {
      return ASSETS.accountApp.controllers.emailVerification.verifyAccountEmail(undefined, 'CODE')
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('username')
          err.kind.should.equal('required');
        });
    });

    it('should require confirmationCode as the second argument', function () {
      return ASSETS.accountApp.controllers.emailVerification.verifyAccountEmail('username', undefined)
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('confirmationCode')
          err.kind.should.equal('required');
        });
    });
  });
});
