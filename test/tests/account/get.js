// third-party dependencies
const should = require('should');
const superagent = require('superagent');

// auxiliary
const aux = require('../../auxiliary');

const hAccount = require('../../../server');

describe('User Account read', function () {

  var ASSETS;

  function _logIn(credentials, callback) {

    // first retrieve the token
    superagent
      .post(ASSETS.accountURI + '/public/auth/token/generate')
      .send(credentials)
      .end(function (err, res) {
        if (err) { return callback(err); }

        var token = res.body.data.token;

        callback(null, token);
      });
  }

  beforeEach(function (done) {
    this.timeout(4000);

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
        // create 2 accounts
        
        var u1Promise = new Promise((resolve, reject) => {
          superagent
            .post(ASSETS.accountURI + '/public/accounts')
            .send({
              username: 'test-user',
              email: 'test1@dev.habem.us',
              password: 'test-password',
              ownerData: {
                givenName: 'João',
                familyName: 'Sauro',
              },
              legal: {
                termsOfService: {
                  agreed: true,
                }
              }
            })
            .end(function (err, res) {
              if (err) { return reject(err); }

              resolve(res.body.data);
            });
        });

        var u2Promise = new Promise((resolve, reject) => {
          superagent
            .post(ASSETS.accountURI + '/public/accounts')
            .send({
              username: 'test-user-2',
              email: 'test2@dev.habem.us',
              password: 'test-password-2',
              ownerData: {
                givenName: 'João',
                familyName: 'Sauro',
              },
              legal: {
                termsOfService: {
                  agreed: true,
                }
              }
            })
            .end(function (err, res) {
              if (err) { return reject(err); }

              resolve(res.body.data);
            });
        });

        return Promise.all([u1Promise, u2Promise]);
      })
      .then((accounts) => {

        // store the accounts for test use
        ASSETS.accounts = accounts;

        done();
      })
      .catch(done);
  });

  afterEach(function (done) {
    aux.teardown().then(done).catch(done);
  });

  it('should return 403 when given no credentials', function (done) {
    superagent
      .get(ASSETS.accountURI + '/public/account/test-user')
      .end(function (err, res) {

        res.statusCode.should.equal(403);
        done();
      });
  });

  it('should return 403 when given no credentials even if the username does not exist', function (done) {
    superagent
      .get(ASSETS.accountURI + '/public/account/test-unexistent-user')
      .end(function (err, res) {

        res.statusCode.should.equal(403);
        done();
      });
  });

  it('should return 403 when using invalid token for the given user data: accounts should not access other user\'s data', function (done) {

    _logIn({
      username: 'test-user-2',
      password: 'test-password-2'
    }, function (err, token) {

      if (err) { return done(err); }

      superagent
        .get(ASSETS.accountURI + '/public/account/test-user')
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
        .get(ASSETS.accountURI + '/public/account/test-user')
        .set('Authorization', 'Bearer' + token)
        .end(function (err, res) {
          res.statusCode.should.equal(403);

          should(res.body.data).be.undefined();
          res.body.error.name.should.equal('InvalidToken');

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
        .get(ASSETS.accountURI + '/public/account/' + ASSETS.accounts[0].username)
        .set('Authorization', 'Bearer ' + token)
        .end(function (err, res) {
          if (err) { return done(err); }

          res.statusCode.should.equal(200);

          // make sure the user data only returns 7 properties
          Object.keys(res.body.data).length.should.equal(7);
          res.body.data.username.should.equal('test-user');
          res.body.data.email.should.equal('test1@dev.habem.us');
          res.body.data.createdAt.should.be.a.String();
          res.body.data.preferences.should.be.an.Object();
          res.body.data.applicationConfig.should.be.an.Object();
          res.body.data.ownerData.should.be.an.Object();

          // owner
          res.body.data.ownerData.givenName.should.be.a.String();
          res.body.data.ownerData.familyName.should.be.a.String();

          // status
          Object.keys(res.body.data.status).length.should.equal(3);
          res.body.data.status.value.should.equal('new');
          res.body.data.status.updatedAt.should.be.instanceof(String);
          res.body.data.status.reason.should.be.instanceof(String);

          done();
        });
    });
  });

});