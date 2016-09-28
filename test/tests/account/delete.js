// third-party dependencies
const should = require('should');
const superagent = require('superagent');

// auxiliary
const aux = require('../../auxiliary');

const hAccount = require('../../../server');

describe('User Account deletion', function () {

  var ASSETS;

  function _logIn(credentials, callback) {

    // first retrieve the token
    superagent
      .post(ASSETS.accountURI + '/auth/token/generate')
      .send(credentials)
      .end(function (err, res) {
        if (err) { return callback(err); }

        var token = res.body.data.token;

        callback(null, token);
      });
  }

  beforeEach(function (done) {
    aux.setup()
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
            .post(ASSETS.accountURI + '/accounts')
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
            .post(ASSETS.accountURI + '/accounts')
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

  it('should not allow delete without any authentication', function (done) {

    superagent
      .delete(ASSETS.accountURI + '/account/test-user')
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
        .delete(ASSETS.accountURI + '/account/test-user')
        .set('Authorization', 'Bearer ' + token)
        .end(function (err, res) {

          res.statusCode.should.equal(403);
          res.body.error.name.should.equal('Unauthorized');

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
        .delete(ASSETS.accountURI + '/account/' + ASSETS.users[0].username)
        .set('Authorization', 'Bearer ' + token)
        .end(function (err, res) {

          res.statusCode.should.equal(204);

          // check if the user still exists
          ASSETS.db.collection('users').findOne({
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