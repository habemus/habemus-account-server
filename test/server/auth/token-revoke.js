// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const jwt        = require('jsonwebtoken');

// test-specific dependencies
const testServer = require('../../auxiliary/server');

describe('POST /auth/token/revoke', function () {

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
  
  it('should make the token useless', function (done) {

    var token1 = new Promise(function (resolve, reject) {

      superagent
        .post(testServer.uri + '/auth/token/generate')
        .send({
          username: 'test-user',
          password: 'test-password'
        })
        .end((err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response.body.data.token);
          }
        });
    });

    var token2 = new Promise(function (resolve, reject) {
      superagent
        .post(testServer.uri + '/auth/token/generate')
        .send({
          username: 'test-user-2',
          password: 'test-password-2'
        })
        .end((err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response.body.data.token);
          }
        })
    });

    var _tokens;

    Promise.all([token1, token2])
      .then((tokens) => {

        // save tokens for later usage
        _tokens = tokens;

        return new Promise((resolve, reject) => {
          superagent
            .post(testServer.uri + '/auth/token/revoke')
            .set({
              'Authorization': 'Bearer ' + tokens[0]
            })
            .end((err, response) => {
              if (err) {
                reject(err);
              } else {
                resolve(response.body.data);
              }
            })
        })
      })
      .then((responseData) => {
        console.log(responseData);

        // try to use the revoked token
        return new Promise((resolve, reject) => {
          superagent
            .post(testServer.uri + '/auth/token/decode')
            .send({ token: _tokens[0] })
            .end((err, response) => {
              if (err) {
                // we expect an error!
                response.statusCode.should.equal(403);
                done();
              } else {
                done(new Error('error expected: the token should have been revoked'));
              }
            })
        });
      })
      .catch(done);
  });
});