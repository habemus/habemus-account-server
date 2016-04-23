// third-party dependencies
const should = require('should');
const superagent = require('superagent');

// test-specific dependencies
const testServer = require('../../auxiliary/server');

describe('GET /user/:username', function () {

  const URI = testServer.uri + '/user/:username';

  function _logIn(credentials, callback) {

    // first retrieve the token
    superagent
      .post(testServer.uri + '/auth/token/generate')
      .send(credentials)
      .end(function (err, res) {
        if (err) { return callback(err); }

        var token = res.body.data.token;

        callback(null, token);
      });
  }

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

  it('should return 403 when given no credentials', function (done) {
    superagent
      .get(testServer.uri + '/user/test-user')
      .end(function (err, res) {

        res.statusCode.should.equal(403);
        done();
      });
  });

  it('should return 403 when given no credentials even if the username does not exist', function (done) {
    superagent
      .get(testServer.uri + '/user/test-unexistent-user')
      .end(function (err, res) {

        res.statusCode.should.equal(403);
        done();
      });
  });

  it('should return 403 when using invalid token for the given user data: users should not access other user\'s data', function (done) {

    _logIn({
      username: 'test-user-2',
      password: 'test-password-2'
    }, function (err, token) {

      if (err) { return done(err); }

      superagent
        .get(testServer.uri + '/user/test-user')
        .set('Authorization', 'Bearer ' + token)
        .end(function (err, res) {

          res.statusCode.should.equal(403)

          done();
        });
    });

  });

  it('should return 403 if Authorization header is malformed', function (done) {

    _logIn({
      username: 'test-user',
      password: 'test-password',
    }, function (err, token) {
      if (err) { return done(err); }

      superagent
        .get(testServer.uri + '/user/test-user')
        .set('Authorization', 'Bearer' + token)
        .end(function (err, res) {
          res.statusCode.should.equal(403);

          should(res.body.data).be.undefined();
          res.body.error.code.should.equal('InvalidToken');

          done();
        });
    });
  });

  it('should return the user\'s data when using a valid token', function (done) {

    _logIn({
      username: 'test-user',
      password: 'test-password',
    }, function (err, token) {

      if (err) { return done(err); }

      superagent
        .get(testServer.uri + '/user/test-user')
        .set('Authorization', 'Bearer ' + token)
        .end(function (err, res) {
          if (err) { return done(err); }

          res.statusCode.should.equal(200);
          res.body.data.username.should.equal('test-user');
          res.body.data.createdAt.should.be.a.String();

          // make sure the user data only returns 2 properties
          Object.keys(res.body.data).length.should.equal(2);

          done();
        });
    });
  });

});