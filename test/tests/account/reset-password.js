// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const Bluebird   = require('bluebird');
const mockery  = require('mockery');

// auxiliary
const aux = require('../../auxiliary');

const hAccount = require('../../../server');

describe('User Account password reset', function () {

  var ASSETS;

  function _logIn(credentials, callback) {

    // first retrieve the token
    superagent
      .post(ASSETS.accountURI + '/public/auth/token/generate')
      .send(credentials)
      .end(function (err, res) {
        if (err) { return callback(err); }

        var token = res.body.data.token;

        callback(null, token);
      });
  }

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
        // create 2 users
        
        var u1Promise = new Promise((resolve, reject) => {
          superagent
            .post(ASSETS.accountURI + '/public/accounts')
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
            .post(ASSETS.accountURI + '/public/accounts')
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
      });
  });

  afterEach(function () {
    mockery.disable();

    return aux.teardown();
  });

  it('should first create a request for password reset', function (done) {

    superagent
      .post(ASSETS.accountURI + '/public/request-password-reset')
      .send({
        email: 'test1@dev.habem.us',
      })
      .end(function (err, res) {
        // response should only acknowledge request was made
        res.statusCode.should.equal(204);

        res.body.should.eql({});

        done();
      });
  });

  it('should refuse to create a password-reset request if not given an email', function (done) {

    superagent
      .post(ASSETS.accountURI + '/public/request-password-reset')
      .send({
        email: undefined,
      })
      .end(function (err, res) {
        // response should only acknowledge request was made
        res.statusCode.should.equal(400);

        res.body.error.errors.length.should.equal(1);
        res.body.error.name.should.equal('InvalidOption');
        res.body.error.option.should.equal('email');
        res.body.error.kind.should.equal('required');

        done();
      });
  });

  it('should refuse to create a password-reset request for a user that does not exist', function (done) {

    superagent
      .post(ASSETS.accountURI + '/public/request-password-reset')
      .send({
        email: 'does-not-exist@habem.us',
      })
      .end(function (err, res) {
        // response should only acknowledge request was made
        res.statusCode.should.equal(404);

        res.body.error.errors.length.should.equal(1);
        res.body.error.name.should.equal('UserNotFound');

        done();
      });
  });

  it('should successfully reset password after request was made and verification code is correct', function (done) {

    // var to hold pwdResetConfirmationCode
    var pwdResetConfirmationCode;

    superagent
      .post(ASSETS.accountURI + '/public/request-password-reset')
      .send({
        email: 'test1@dev.habem.us',
      })
      .end(function (err, res) {
        if (err) { return done(err); }

        // response should only acknowledge request was made
        res.statusCode.should.equal(204);

        // make sure the confirmation code is already available
        pwdResetConfirmationCode = ASSETS.scheduledMail.data.code;
        pwdResetConfirmationCode.should.be.a.String();

        superagent
          .post(ASSETS.accountURI + '/public/reset-password')
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
              .post(ASSETS.accountURI + '/public/auth/token/generate')
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

    this.timeout(5000);

    var NEW_PWD = 'new-different-password';

    superagent
      .post(ASSETS.accountURI + '/public/request-password-reset')
      .send({
        email: 'test1@dev.habem.us',
      })
      .end(function (err, res) {
        // response should only acknowledge request was made
        res.statusCode.should.equal(204);

        superagent
          .post(ASSETS.accountURI + '/public/reset-password')
          .send({
            username: 'test-user',
            code: 'wrong-code',
            password: NEW_PWD,
          })
          .end(function (err, res) {
            if (!err) { return done(new Error('error expected')); }

            res.statusCode.should.equal(401);
            res.body.error.name.should.equal('InvalidCredentials');

            // it should not be possible to login using the new password
            superagent
              .post(ASSETS.accountURI + '/public/auth/token/generate')
              .send({
                username: 'test-user',
                password: NEW_PWD
              })
              .end(function (err, res) {
                if (!err) { return done(new Error('error expected')); }

                res.statusCode.should.equal(401);
                res.body.error.name.should.equal('InvalidCredentials');

                // it should still be possible to login using original password
                superagent
                  .post(ASSETS.accountURI + '/public/auth/token/generate')
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