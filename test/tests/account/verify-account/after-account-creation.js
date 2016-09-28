// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const Bluebird   = require('bluebird');
const mockery  = require('mockery');

// auxiliary
const aux = require('../../../auxiliary');

const hAccount = require('../../../../server');

describe('User Account verification after-creation', function () {

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
      })
      .then(() => {
        // create one user
        var u1Promise = new Promise((resolve, reject) => {
          superagent
            .post(ASSETS.accountURI + '/accounts')
            .send({
              username: 'test-user',
              email: 'test1@dev.habem.us',
              password: 'test-password'
            })
            .end(function (err, res) {
              if (err) { return reject(err); }

              resolve(res.body.data);
            });
        });

        return u1Promise;
      })
      .then((user) => {

        ASSETS.user = user;
      });
  });

  afterEach(function () {
    mockery.disable();

    return aux.teardown();
  });

  it('should create a verification request', function (done) {
    superagent
      .post(ASSETS.accountURI + '/account/' + ASSETS.user.username + '/request-email-verification')
      .end(function (err, res) {
        if (err) { return done(err); }

        res.statusCode.should.equal(201);
        // should not return any data
        res.body.should.eql({});

        done();
      });

  });

  it('should successfully verify account', function (done) {

    // var to hold accVerificationConfirmationCode
    var accVerificationConfirmationCode;

    superagent
      .post(ASSETS.accountURI + '/account/' + ASSETS.user.username + '/request-email-verification')
      .end(function (err, res) {
        if (err) { return done(err); }

        res.statusCode.should.equal(201);
        // should not return any data
        res.body.should.eql({});

        // check that the confirmation code was sent
        accVerificationConfirmationCode = ASSETS.scheduledMail.data.code;
        accVerificationConfirmationCode.should.be.instanceof(String);

        superagent
          .post(ASSETS.accountURI + '/account/' + ASSETS.user.username + '/verify-email')
          .send({
            code: accVerificationConfirmationCode,
          })
          .end(function (err, res) {
            if (err) { return done(err); }

            res.statusCode.should.equal(200);
            res.body.should.eql({});

            // it should not be possible to verify again
            superagent
              .post(ASSETS.accountURI + '/account/' + ASSETS.user.username + '/verify-email')
              .send({
                code: accVerificationConfirmationCode,
              })
              .end(function (err, res) {
                if (!err) { return done(new Error('error expected')); }

                res.statusCode.should.equal(401);
                res.body.error.name.should.equal('InvalidCredentials');
                res.body.error.errors.length.should.equal(1);

                done();
              });
          });
      });

  });

});