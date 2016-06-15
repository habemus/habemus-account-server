// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const stubTransort = require('nodemailer-stub-transport');

// auxiliary
const aux = require('../../auxiliary');

const createHAuth = require('../../../server');

describe('User Account deletion', function () {

  var ASSETS;

  function _logIn(credentials, callback) {

    // first retrieve the token
    superagent
      .post(ASSETS.authURI + '/auth/token/generate')
      .send(credentials)
      .end(function (err, res) {
        if (err) { return callback(err); }

        var token = res.body.data.token;

        callback(null, token);
      });
  }

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
        // create 2 users
        
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

        var u2Promise = new Promise((resolve, reject) => {
          superagent
            .post(ASSETS.authURI + '/users')
            .send({
              username: 'test-user-2',
              email: 'test2@dev.habem.us',
              password: 'test-password-2'
            })
            .end(function (err, res) {
              if (err) { return reject(err); }

              resolve(res.body.data);
            });
        });

        return Promise.all([u1Promise, u2Promise]);
      })
      .then((users) => {

        // store the users for test use
        ASSETS.users = users;

        done();
      })
      .catch(done);
  });

  afterEach(function (done) {
    aux.teardown().then(done).catch(done);
  });

  it('should first create a request for password reset', function (done) {

    superagent
      .post(ASSETS.authURI + '/request-password-reset')
      .send({
        username: 'test-user',
      })
      .end(function (err, res) {
        // response should only acknowledge request was made
        res.statusCode.should.equal(204);

        res.body.should.eql({});

        done();
      });
  });

  it('should refuse to create a password-reset request if not given a username', function (done) {

    superagent
      .post(ASSETS.authURI + '/request-password-reset')
      .send({
        username: undefined,
      })
      .end(function (err, res) {
        // response should only acknowledge request was made
        res.statusCode.should.equal(400);

        res.body.error.errors.length.should.equal(1);
        res.body.error.code.should.equal('UsernameMissing');

        done();
      });
  });

  it('should successfully reset password after request was made and verification code is correct', function (done) {

    // var to hold pwdResetConfirmationCode
    var pwdResetConfirmationCode;

    // TODO: this is very hacky
    var confirmationCodeRe = /To reset your password, please enter the code (.*?)\s/;

    // add listener to the log event of the node mailer stub transport
    ASSETS.nodemailerTransport.on('log', function (log) {
      if (log.type === 'message') {
        var match = log.message.match(confirmationCodeRe);

        if (match) {

          pwdResetConfirmationCode = match[1];
        }
      }
    });

    superagent
      .post(ASSETS.authURI + '/request-password-reset')
      .send({
        username: 'test-user',
      })
      .end(function (err, res) {
        if (err) { return done(err); }

        // response should only acknowledge request was made
        res.statusCode.should.equal(204);

        // make sure the confirmation code is already available
        pwdResetConfirmationCode.should.be.a.String();

        superagent
          .post(ASSETS.authURI + '/reset-password')
          .send({
            username: 'test-user',
            code: pwdResetConfirmationCode,
            password: 'new-different-password',
          })
          .end(function (err, res) {
            if (err) { return done(err); }
            // response should only acknowledge success
            res.statusCode.should.equal(204);
            res.body.should.eql({});

            // it should be possible to login using the new password
            superagent
              .post(ASSETS.authURI + '/auth/token/generate')
              .send({
                username: 'test-user',
                password: 'new-different-password'
              })
              .end(function (err, res) {
                if (err) { return done(err); }

                res.statusCode.should.equal(201);
                res.body.data.token.should.be.instanceof(String);

                Object.keys(res.body.data).length.should.equal(1);

                done();
              });
          });

      });
  });

  it('should fail to reset password if given the wrong reset code', function (done) {

    var NEW_PWD = 'new-different-password';

    superagent
      .post(ASSETS.authURI + '/request-password-reset')
      .send({
        username: 'test-user',
      })
      .end(function (err, res) {
        // response should only acknowledge request was made
        res.statusCode.should.equal(204);

        superagent
          .post(ASSETS.authURI + '/reset-password')
          .send({
            username: 'test-user',
            code: 'wrong-code',
            password: NEW_PWD,
          })
          .end(function (err, res) {
            if (!err) { return done(new Error('error expected')); }

            res.statusCode.should.equal(401);
            res.body.error.code.should.equal('InvalidCredentials');

            // it should not be possible to login using the new password
            superagent
              .post(ASSETS.authURI + '/auth/token/generate')
              .send({
                username: 'test-user',
                password: NEW_PWD
              })
              .end(function (err, res) {
                if (!err) { return done(new Error('error expected')); }

                res.statusCode.should.equal(401);
                res.body.error.code.should.equal('InvalidCredentials');

                // it should still be possible to login using original password
                superagent
                  .post(ASSETS.authURI + '/auth/token/generate')
                  .send({
                    username: 'test-user',
                    password: 'test-password',
                  })
                  .end(function (err, res) {
                    if (err) { return done(err); }

                    res.statusCode.should.equal(201);
                    res.body.data.token.should.be.instanceof(String);

                    done();
                  });
                  
              })
          })
      });
  });
});