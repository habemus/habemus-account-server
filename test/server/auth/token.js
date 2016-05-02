// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const jwt        = require('jsonwebtoken');

// test-specific dependencies
const testServer = require('../../auxiliary/server');

describe('POST /auth/token/generate', function () {

  before(function (done) {
    // start listening
    testServer.start(function () {

      // create 2 users
      
      var u1Promise = new Promise((resolve, reject) => {
        superagent
          .post(testServer.uri + '/users')
          .send({
            username: 'test-user',
            password: 'test-password'
          })
          .end(function (err, res) {
            if (err) { return reject(err); }

            resolve();
          });
      });

      var u2Promise = new Promise((resolve, reject) => {
        superagent
          .post(testServer.uri + '/users')
          .send({
            username: 'test-user-2',
            password: 'test-password-2'
          })
          .end(function (err, res) {
            if (err) { return reject(err); }

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
        decoded.username.should.equal('test-user');
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

describe('POST /auth/token/decode', function () {
  before(function (done) {
    // start listening
    testServer.start(function () {

      // create 2 users
      
      var u1Promise = new Promise((resolve, reject) => {
        superagent
          .post(testServer.uri + '/users')
          .send({
            username: 'test-user',
            password: 'test-password'
          })
          .end(function (err, res) {
            if (err) { return reject(err); }

            resolve();
          });
      });

      var u2Promise = new Promise((resolve, reject) => {
        superagent
          .post(testServer.uri + '/users')
          .send({
            username: 'test-user-2',
            password: 'test-password-2'
          })
          .end(function (err, res) {
            if (err) { return reject(err); }

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

  it('should require a token to be sent for decoding', function (done) {

    superagent
      .post(testServer.uri + '/auth/token/decode')
      .send({})
      .end(function (err, res) {
        res.statusCode.should.equal(400);

        should(res.body.data).be.undefined();
        res.body.error.code.should.equal('TokenMissing');

        done();
      });

  });

  it('should return 403 for false token', function (done) {

    var deceitfulUserData = {
      username: 'deceitful-user',
      createdAt: '2016-04-20'
    };

    var deceitfulToken = jwt.sign(deceitfulUserData, 'DECEITFUL-SECRET', {
      expiresIn: '1h',
    });

    superagent
      .post(testServer.uri + '/auth/token/decode')
      .send({
        token: deceitfulToken,
      })
      .end(function (err, res) {
        res.statusCode.should.equal(403);
        res.body.error.code.should.equal('InvalidToken');
        should(res.body.data).be.undefined();

        done();
      });
  });

  it('should properly decode a valid token', function (done) {
    // first create the token
    superagent
      .post(testServer.uri + '/auth/token/generate')
      .send({
        username: 'test-user',
        password: 'test-password'
      })
      .end(function (err, res) {
        if (err) { return done(err); }

        var token = res.body.data.token;

        superagent
          .post(testServer.uri + '/auth/token/decode')
          .send({
            token: token
          })
          .end(function (err, res) {
            if (err) { return done(err); }

            res.statusCode.should.equal(200);

            res.body.data.username.should.equal('test-user');
            res.body.data.createdAt.should.be.a.String();

            res.body.data.iat.should.be.a.Number();
            res.body.data.exp.should.be.a.Number();

            Object.keys(res.body.data).length.should.equal(4);

            done();
          });
      });
  });
});