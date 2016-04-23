// third-party dependencies
const should = require('should');
const superagent = require('superagent');

// test-specific dependencies
const testServer = require('../../auxiliary/server');

describe('DELETE /user/:username', function () {

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

  it('should not allow delete without any authentication', function (done) {

    superagent
      .delete(testServer.uri + '/user/test-user')
      .end(function (err, res) {

        res.statusCode.should.equal(403);

        done();
      });
  });

  it('users should not be capable of deleting other users', function (done) {
    _logIn({
      username: 'test-user-2',
      password: 'test-password-2'
    }, function (err, token) {

      superagent
        .delete(testServer.uri + '/user/test-user')
        .set('Authorization', 'Bearer ' + token)
        .end(function (err, res) {

          res.statusCode.should.equal(403);
          res.body.error.code.should.equal('Unauthorized');

          done();
        });
    });
  });

  it('a user should be capable of deleting itself', function (done) {
    _logIn({
      username: 'test-user',
      password: 'test-password'
    }, function (err, token) {

      superagent
        .delete(testServer.uri + '/user/test-user')
        .set('Authorization', 'Bearer ' + token)
        .end(function (err, res) {

          res.statusCode.should.equal(200);

          // check if the user still exists
          testServer.db.collection('users').findOne({
            username: 'test-user'
          })
          .then((user) => {

            should(user).be.null();
            done();
          })
          .catch(done);

        });
    });
  });


});