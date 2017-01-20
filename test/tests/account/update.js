// third-party dependencies
const should = require('should');
const superagent = require('superagent');

// auxiliary
const aux = require('../../auxiliary');

const hAccount = require('../../../server');

describe('User Account updating', function () {

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

  describe('application configurations', function () {

    it('should not allow updating application config without any authentication', function (done) {

      superagent
        .put(ASSETS.accountURI + '/public/account/test-user/config/workspace')
        .send({
          language: 'pt-BR',
          version: 'beta-1',
        })
        .end(function (err, res) {

          res.statusCode.should.equal(403);

          done();
        });
    });

    it('accounts should not be capable of updating other accounts application config', function (done) {
      _logIn({
        username: 'test-user-2',
        password: 'test-password-2'
      }, function (err, token) {

        superagent
          .put(ASSETS.accountURI + '/public/account/test-user/config/workspace')
          .send({
            language: 'pt-BR',
            version: 'beta-1',
            'guides.editor': 'seen',
            'guides.preview': 'seen',
          })
          .set('Authorization', 'Bearer ' + token)
          .end(function (err, res) {

            res.statusCode.should.equal(403);
            res.body.error.name.should.equal('Unauthorized');

            done();
          });
      });
    });

    it('a user should be capable of updating its account application config', function (done) {
      _logIn({
        username: 'test-user',
        password: 'test-password'
      }, function (err, token) {

        var applicationId = 'workspace';

        superagent
          .put(ASSETS.accountURI + '/public/account/' + ASSETS.accounts[0].username + '/config/' + applicationId)
          .send({
            language: 'pt-BR',
            version: 'beta-1',
            'guides.editor': 'seen',
            'guides.preview': 'seen',
          })
          .set('Authorization', 'Bearer ' + token)
          .end(function (err, res) {

            res.statusCode.should.equal(200);

            ASSETS.db.collection('accounts').findOne({
              username: 'test-user'
            })
            .then((account) => {

              var workspaceConfig = account.applicationConfig[applicationId];

              workspaceConfig.language.should.eql('pt-BR');
              workspaceConfig.version.should.eql('beta-1');
              workspaceConfig.guides.editor.should.eql('seen');
              workspaceConfig.guides.preview.should.eql('seen');

              done();
            })
            .catch(done);

          });
      });
    });

    it('should refuse to update configurations for an invalid applicationId', function (done) {
      _logIn({
        username: 'test-user',
        password: 'test-password'
      }, function (err, token) {

        superagent
          .put(ASSETS.accountURI + '/public/account/test-user/config/invalid-app')
          .send({
            language: 'pt-BR',
            version: 'beta-1',
          })
          .set('Authorization', 'Bearer ' + token)
          .end(function (err, res) {

            res.statusCode.should.equal(400);
            res.body.error.name.should.equal('InvalidOption');

            done();
          });
      });
    });
  });

  describe('account preferences', function () {
    it('should not allow updating preferences without any authentication', function (done) {
      superagent
        .put(ASSETS.accountURI + '/public/account/test-user/preferences')
        .send({
          language: 'pt-BR',
        })
        .end(function (err, res) {

          res.statusCode.should.equal(403);

          done();
        });
    });

    it('accounts should not be capable of updating other accounts preferences', function (done) {
      _logIn({
        username: 'test-user-2',
        password: 'test-password-2'
      }, function (err, token) {

        superagent
          .put(ASSETS.accountURI + '/public/account/test-user/preferences')
          .send({
            language: 'pt-BR',
          })
          .set('Authorization', 'Bearer ' + token)
          .end(function (err, res) {

            res.statusCode.should.equal(403);
            res.body.error.name.should.equal('Unauthorized');

            done();
          });
      });
    });

    it('a user should be capable of updating its account preferences', function (done) {
      _logIn({
        username: 'test-user',
        password: 'test-password'
      }, function (err, token) {

        superagent
          .put(ASSETS.accountURI + '/public/account/' + ASSETS.accounts[0].username + '/preferences')
          .send({
            language: 'es-ES',
          })
          .set('Authorization', 'Bearer ' + token)
          .end(function (err, res) {

            res.statusCode.should.equal(200);

            ASSETS.db.collection('accounts').findOne({
              username: 'test-user'
            })
            .then((account) => {
              var workspaceConfig = account.preferences.language.should.eql('es-ES');
              done();
            })
            .catch(done);

          });
      });
    });
  });

  describe('owner data', function () {
    it('should not allow updating owner data without any authentication', function (done) {
      superagent
        .put(ASSETS.accountURI + '/public/account/test-user/owner')
        .send({
          givenName: 'Maria'
        })
        .end(function (err, res) {

          res.statusCode.should.equal(403);

          done();
        });
    });

    it('accounts should not be capable of updating other accounts owner data', function (done) {
      _logIn({
        username: 'test-user-2',
        password: 'test-password-2'
      }, function (err, token) {

        superagent
          .put(ASSETS.accountURI + '/public/account/test-user/owner')
          .send({
            givenName: 'Maria'
          })
          .set('Authorization', 'Bearer ' + token)
          .end(function (err, res) {

            res.statusCode.should.equal(403);
            res.body.error.name.should.equal('Unauthorized');

            done();
          });
      });
    });

    it('a user should be capable of updating its account owner data', function (done) {
      _logIn({
        username: 'test-user',
        password: 'test-password'
      }, function (err, token) {

        superagent
          .put(ASSETS.accountURI + '/public/account/' + ASSETS.accounts[0].username + '/owner')
          .send({
            givenName: 'Maria'
          })
          .set('Authorization', 'Bearer ' + token)
          .end(function (err, res) {

            res.statusCode.should.equal(200);

            ASSETS.db.collection('accounts').findOne({
              username: 'test-user'
            })
            .then((account) => {

              account.ownerData.givenName.should.equal('Maria');
              done();
            })
            .catch(done);

          });
      });
    });

  });

});
