// third-party dependencies
const should = require('should');
const superagent = require('superagent');

// test-specific dependencies
const testServer = require('../../auxiliary/server');


describe('POST /users', function () {

  const URI = testServer.uri + '/users';

  before(function (done) {
    // start listening
    testServer.start(done);
  });

  after(function (done) {
    // start listening
    testServer.stop(done);
  });

  it('should reject verifying users that do not exist', function (done) {

    var FAKE_USER_ID = '57493bb407b079902681fe0d';

    superagent
      .post(testServer.uri + '/user/' + FAKE_USER_ID + '/verify')
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

  it('should reject verifying users that have no valid ids', function (done) {
    superagent
      .post(testServer.uri + '/user/INVALID/verify')
      .send({
        code: 'fake-code'
      })
      .end((err, res) => {
        if (err) {
          // we expect error
          // and this one should behave as the one with a valid 
          // but inexistent id
          res.statusCode.should.equal(401);
          done();
        } else {
          done(new Error('invalid user id should not be validated'));
        }
      })
  });

  it('should reject invalid verification code', function (done) {

    superagent
      .post(testServer.uri + '/users')
      .send({
        username: 'test-user',
        email: 'testemail@dev.habem.us',
        password: 'test-password'
      })
      .end(function (err, res) {

        if (err) { return done(err); }

        console.log(res.body.data);

        res.statusCode.should.equal(201);

        res.body.data.username.should.equal('test-user');

        userData = res.body.data;

        superagent
          .post(testServer.uri + '/user/' + res.body.data._id + '/verify')
          .send({
            code: 'INVALID-VERIFICATION-CODE',
          })
          .end((err, res) => {
            if (err) {
              // we expect an error!
              res.statusCode.should.equal(403);
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
    testServer.options.nodemailerTransport.on('log', function (log) {


      if (log.type === 'message') {
        var match = log.message.match(confirmationCodeRe);

        if (match) {

          userVerificationCode = match[1];
        }
      }
    });

    superagent
      .post(testServer.uri + '/users')
      .send({
        username: 'test-user-2',
        email: 'testemail2@dev.habem.us',
        password: 'test-password'
      })
      .end(function (err, res) {

        if (err) { return done(err); }

        res.statusCode.should.equal(201);

        res.body.data.username.should.equal('test-user-2');

        userData = res.body.data;

        // make sure the confirmation code is already available
        userVerificationCode.should.be.a.String();

        superagent
          .post(testServer.uri + '/user/' + res.body.data._id + '/verify')
          .send({
            code: userVerificationCode,
          })
          .end((err, res) => {
            if (err) { return done(err); }

            res.statusCode.should.equal(200);
            done();
          });
      });
  });
});