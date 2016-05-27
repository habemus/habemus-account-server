// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const jwt        = require('jsonwebtoken');

// test-specific dependencies
const testServer = require('../../auxiliary/server');

describe('POST /auth/token/decode', function () {

  var USER_1;
  var USER_2;

  before(function (done) {
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

            res.body.data.sub.should.equal(USER_1._id);
            res.body.data.createdAt.should.be.a.String();

            res.body.data.iat.should.be.a.Number();
            res.body.data.exp.should.be.a.Number();

            Object.keys(res.body.data).length.should.equal(4);

            done();
          });
      });
  });
});