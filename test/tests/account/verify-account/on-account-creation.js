// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const Bluebird   = require('bluebird');
const mockery  = require('mockery');

// auxiliary
const aux = require('../../../auxiliary');

const hAccount = require('../../../../server');

describe('User Account verification', function () {

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
        ASSETS.accountURI = 'http://localhost:4000';

        return ASSETS.accountApp.ready;
      })
      .then(() => {
        return aux.startServer(4000, ASSETS.accountApp);
      });
  });

  afterEach(function () {
    mockery.disable();
    return aux.teardown();
  });

  it('should reject verifying users that do not exist', function (done) {
    superagent
      .post(ASSETS.accountURI + '/account/' + 'fake-username' + '/verify-email')
      .send({
        code: 'fake-code'
      })
      .end((err, res) => {
        if (err) {
          // error expected!
          res.statusCode.should.equal(401);
          done();
        } else {
          done(new Error('user does not exist and validation should not occur'));
        }
      });
  });

  it('should reject invalid verification code', function (done) {

    superagent
      .post(ASSETS.accountURI + '/accounts')
      .send({
        username: 'test-user',
        email: 'testemail@dev.habem.us',
        password: 'test-password'
      })
      .end(function (err, res) {

        if (err) {
          return done(err);
        }

        res.statusCode.should.equal(201);
        res.body.data.username.should.equal('test-user');

        superagent
          .post(ASSETS.accountURI + '/account/test-user/verify-email')
          .send({
            code: 'INVALID-VERIFICATION-CODE',
          })
          .end((err, res) => {
            if (err) {
              // we expect an error!
              res.statusCode.should.equal(401);
              done();
            } else {
              done(new Error('invalid verification code should have been rejected'));
            }
          });
      });
  });

  it('should send an email with account verification code', function (done) {

    // var to hold userVerificationCode
    var userVerificationCode;

    superagent
      .post(ASSETS.accountURI + '/accounts')
      .send({
        username: 'test-user-2',
        email: 'testemail2@dev.habem.us',
        password: 'test-password'
      })
      .end(function (err, res) {

        if (err) { return done(err); }

        res.statusCode.should.equal(201);
        res.body.data.username.should.equal('test-user-2');

        // make sure the confirmation code is already available
        userVerificationCode = ASSETS.scheduledMail.data.code;
        userVerificationCode.should.be.a.String();

        superagent
          .get(ASSETS.accountURI + '/account/' + res.body.data.username + '/verify-email')
          .query({
            code: userVerificationCode,
          })
          .end((err, res) => {
            if (err) { return done(err); }

            // verification should be successful
            res.statusCode.should.equal(200);
            done();
          });
      });
  });


  it('verifying an already verified account should be rejected', function (done) {

    // var to hold userVerificationCode
    var userVerificationCode;

    superagent
      .post(ASSETS.accountURI + '/accounts')
      .send({
        username: 'test-user-3',
        email: 'testemail3@dev.habem.us',
        password: 'test-password'
      })
      .end(function (err, res) {

        if (err) { return done(err); }

        res.statusCode.should.equal(201);
        res.body.data.username.should.equal('test-user-3');

        // make sure the confirmation code is already available
        userVerificationCode = ASSETS.scheduledMail.data.code;
        userVerificationCode.should.be.a.String();

        var username = res.body.data.username;

        superagent
          .post(ASSETS.accountURI + '/account/' + username + '/verify-email')
          .send({
            code: userVerificationCode,
          })
          .end((err, res) => {
            if (err) { return done(err); }

            // verification should be successful
            res.statusCode.should.equal(200);

            superagent
              .post(ASSETS.accountURI + '/account/' + username + '/verify-email')
              .send({
                code: userVerificationCode,
              })
              .end(function (err, res) {
                if (err) {
                  res.statusCode.should.equal(401);
                  res.body.error.name.should.equal('InvalidCredentials');
                  done();

                } else {
                  done(new Error('error is expected'));
                }
              })
          });
      });
  });
});