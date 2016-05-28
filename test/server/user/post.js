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

  it('should require a username', function (done) {
    superagent
      .post(URI)
      .send({
        password: 'test-password'
      })
      .end(function (err, res) {
        res.statusCode.should.equal(400);
        done();
      });
  });

  it('should require a password', function (done) {
    superagent
      .post(URI)
      .send({
        username: 'test-user'
      })
      .end(function (err, res) {
        res.statusCode.should.equal(400);
        done();
      });
  });

  it('should create a new user', function (done) {

    superagent
      .post(URI)
      .send({
        username: 'test-user',
        email: 'testemail@dev.habem.us',
        password: 'test-password'
      })
      .end(function (err, res) {

        if (err) { return done(err); }

        res.statusCode.should.equal(201);

        res.body.data.username.should.equal('test-user');
        res.body.data.createdAt.should.be.a.String();

        testServer.db.collection('users').find().toArray((err, users) => {
          users.length.should.equal(1);

          users[0].username.should.equal('test-user');
          users[0].pwdHash.should.be.a.String();

          done();
        });
      });
  });

  it('should enforce username uniqueness', function (done) {
    // IMPORTANT: depends on the previous test! ('should create a new user')

    superagent
      .post(testServer.uri + '/users')
      .send({
        username: 'test-user',
        password: 'test-password',
      })
      .end(function (err, res) {
        res.statusCode.should.equal(400);

        done();
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