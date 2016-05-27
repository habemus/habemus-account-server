// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const jwt        = require('jsonwebtoken');

// test-specific dependencies
const testServer = require('../../auxiliary/server');

describe('POST /auth/token/generate', function () {

  var USER_1;
  var USER_2;

  before(function (done) {

    this.timeout(10000);

    // start listening
    testServer.start(function () {

      // create 2 users
      
      var u1Promise = new Promise((resolve, reject) => {
        superagent
          .post(testServer.uri + '/users')
          .send({
            username: 'test-user',
            email: 'test1@dev.habem.us',
            password: 'test-password'
          })
          .end(function (err, res) {
            if (err) { return reject(err); }

            USER_1 = res.body.data;

            resolve();
          });
      });

      var u2Promise = new Promise((resolve, reject) => {
        superagent
          .post(testServer.uri + '/users')
          .send({
            username: 'test-user-2',
            email: 'test2@dev.habem.us',
            password: 'test-password-2'
          })
          .end(function (err, res) {
            if (err) { return reject(err); }

            USER_2 = res.body.data;

            resolve();
          });
      });

      // wait for both users to be created before starting tests
      Promise.all([u1Promise, u2Promise]).then(() => {
        done();
      })
      .catch(done);
    });
  });

  after(function (done) {
    // start listening
    testServer.stop(done);
  });

  it('should require username', function (done) {
    superagent
      .post(testServer.uri + '/auth/token/generate')
      .send({
        username: undefined,
        password: 'test-password'
      })
      .end(function (err, res) {
        res.statusCode.should.equal(400);

        should(res.body.data).be.undefined();
        res.body.error.code.should.equal('UsernameMissing');

        done();
      });
  });

  it('should require password', function (done) {
    superagent
      .post(testServer.uri + '/auth/token/generate')
      .send({
        username: 'test-user',
        password: undefined
      })
      .end(function (err, res) {
        res.statusCode.should.equal(400);

        should(res.body.data).be.undefined();
        res.body.error.code.should.equal('PasswordMissing');

        done();
      });
  });

  it('should not generate a token if credentials are not valid', function (done) {
    superagent
      .post(testServer.uri + '/auth/token/generate')
      .send({
        username: 'test-user',
        password: 'wrong-password'
      })
      .end(function (err, res) {

        res.statusCode.should.equal(401);

        should(res.body.data).be.undefined();
        res.body.error.code.should.equal('InvalidCredentials');

        done();
      });
  });

  it('should respond with the exact same error code if the username is not found', function (done) {
    superagent
      .post(testServer.uri + '/auth/token/generate')
      .send({
        username: 'wrong-user',
        password: 'wrong-password'
      })
      .end(function (err, res) {

        res.statusCode.should.equal(401);

        should(res.body.data).be.undefined();
        res.body.error.code.should.equal('InvalidCredentials');

        done();
      });
  });

  it('should generate a JWT given the right credentials', function (done) {
    superagent
      .post(testServer.uri + '/auth/token/generate')
      .send({
        username: 'test-user',
        password: 'test-password'
      })
      .end(function (err, res) {
        if (err) { return done(err); }

        res.statusCode.should.equal(201);
        res.body.data.token.should.be.a.String();

        // check the data that is inside the token
        var decoded = jwt.verify(res.body.data.token, testServer.options.secret);

        // be sure that all properties are known
        decoded.sub.should.equal(USER_1._id);
        decoded.createdAt.should.be.a.String();

        decoded.iat.should.be.a.Number();
        decoded.exp.should.be.a.Number();
        decoded.jti.should.be.a.String();
        decoded.iss.should.equal('h-auth');

        Object.keys(decoded).length.should.equal(6);

        done();
      });
  });

});