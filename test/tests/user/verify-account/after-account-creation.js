// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const stubTransort = require('nodemailer-stub-transport');

// auxiliary
const aux = require('../../../auxiliary');

const createHAuth = require('../../../../server');

describe('User Account verification after-creation', function () {

  var ASSETS;

  beforeEach(function () {
    return aux.setup()
      .then((assets) => {
        ASSETS = assets;

        ASSETS.nodemailerTransport = stubTransort();

        var options = {
          apiVersion: '0.0.0',
          mongodbURI: assets.dbURI,
          secret: 'fake-secret',

          nodemailerTransport: ASSETS.nodemailerTransport,
          fromEmail: 'from@dev.habem.us',

          host: 'http://localhost'
        };

        ASSETS.authApp = createHAuth(options);
        ASSETS.authURI = 'http://localhost:4000';

        return aux.startServer(4000, ASSETS.authApp);
      })
      .then(() => {
        // create one user
        var u1Promise = new Promise((resolve, reject) => {
          superagent
            .post(ASSETS.authURI + '/users')
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
    return aux.teardown();
  });

  it('should create a verification request', function (done) {
    superagent
      .post(ASSETS.authURI + '/user/' + ASSETS.user.username + '/request-account-verification')
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

    // TODO: this is very hacky
    var confirmationCodeRe = /Your confirmation code is (.*?)\s/;

    // add listener to the log event of the node mailer stub transport
    ASSETS.nodemailerTransport.on('log', function (log) {
      if (log.type === 'message') {
        var match = log.message.match(confirmationCodeRe);

        if (match) {

          accVerificationConfirmationCode = match[1];
        }
      }
    });


    superagent
      .post(ASSETS.authURI + '/user/' + ASSETS.user.username + '/request-account-verification')
      .end(function (err, res) {
        if (err) { return done(err); }

        res.statusCode.should.equal(201);
        // should not return any data
        res.body.should.eql({});

        // check that the confirmation code was sent
        accVerificationConfirmationCode.should.be.instanceof(String);

        superagent
          .post(ASSETS.authURI + '/user/' + ASSETS.user.username + '/verify-account')
          .send({
            code: accVerificationConfirmationCode,
          })
          .end(function (err, res) {
            if (err) { return done(err); }

            res.statusCode.should.equal(200);
            res.body.should.eql({});

            // it should not be possible to verify again
            superagent
              .post(ASSETS.authURI + '/user/' + ASSETS.user.username + '/verify-account')
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