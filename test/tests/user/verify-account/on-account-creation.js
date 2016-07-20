// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const stubTransort = require('nodemailer-stub-transport');

// auxiliary
const aux = require('../../../auxiliary');

const createHAuth = require('../../../../server');

describe('User Account verification', function () {

  var ASSETS;

  beforeEach(function (done) {
    aux.setup()
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
        done();
      })
      .catch(done);
  });

  afterEach(function (done) {
    aux.teardown().then(done).catch(done);
  });

  it('should reject verifying users that do not exist', function (done) {
    superagent
      .post(ASSETS.authURI + '/user/' + 'fake-username' + '/verify-account')
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
      .post(ASSETS.authURI + '/users')
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
          .post(ASSETS.authURI + '/user/test-user/verify-account')
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

    // TODO: this is very hacky
    var confirmationCodeRe = /Your confirmation code is (.*?)\s/;

    // add listener to the log event of the node mailer stub transport
    ASSETS.nodemailerTransport.on('log', function (log) {
      if (log.type === 'message') {
        var match = log.message.match(confirmationCodeRe);

        if (match) {

          userVerificationCode = match[1];
        }
      }
    });

    superagent
      .post(ASSETS.authURI + '/users')
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
        userVerificationCode.should.be.a.String();

        superagent
          .get(ASSETS.authURI + '/user/' + res.body.data.username + '/verify-account')
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

    // TODO: this is very hacky
    var confirmationCodeRe = /Your confirmation code is (.*?)\s/;

    // add listener to the log event of the node mailer stub transport
    ASSETS.nodemailerTransport.on('log', function (log) {
      if (log.type === 'message') {
        var match = log.message.match(confirmationCodeRe);

        if (match) {

          userVerificationCode = match[1];
        }
      }
    });

    superagent
      .post(ASSETS.authURI + '/users')
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
        userVerificationCode.should.be.a.String();

        var username = res.body.data.username;

        superagent
          .post(ASSETS.authURI + '/user/' + username + '/verify-account')
          .send({
            code: userVerificationCode,
          })
          .end((err, res) => {
            if (err) { return done(err); }

            // verification should be successful
            res.statusCode.should.equal(200);

            superagent
              .post(ASSETS.authURI + '/user/' + username + '/verify-account')
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