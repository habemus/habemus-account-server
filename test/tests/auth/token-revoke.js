// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const stubTransort = require('nodemailer-stub-transport');
const jwt        = require('jsonwebtoken');

// auxiliary
const aux = require('../../auxiliary');

const hAccount = require('../../../server');

describe('POST /auth/token/decode', function () {

  var ASSETS;

  beforeEach(function (done) {
    aux.setup()
      .then((assets) => {
        ASSETS = assets;

        var options = {
          apiVersion: '0.0.0',
          mongodbURI: assets.dbURI,
          secret: 'fake-secret',

          nodemailerTransport: stubTransort(),
          fromEmail: 'from@dev.habem.us',

          host: 'http://localhost'
        };

        ASSETS.authApp = hAccount(options);
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
  
  it('should make the token useless', function (done) {

    var token1 = new Promise(function (resolve, reject) {

      superagent
        .post(ASSETS.authURI + '/auth/token/generate')
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
        .post(ASSETS.authURI + '/auth/token/generate')
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
            .post(ASSETS.authURI + '/auth/token/revoke')
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

        // try to use the revoked token
        return new Promise((resolve, reject) => {
          superagent
            .post(ASSETS.authURI + '/auth/token/decode')
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