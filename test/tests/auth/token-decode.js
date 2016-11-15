// third-party dependencies
const should = require('should');
const superagent = require('superagent');
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

        ASSETS.accountApp = hAccount(aux.genOptions());
        ASSETS.accountURI = 'http://localhost:4000';

        return aux.startServer(4000, ASSETS.accountApp);
      })
      .then(() => {
        return ASSETS.accountApp.ready;
      })
      .then(() => {
        // create 2 users
        
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
              }
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

  it('should require a token to be sent for decoding', function (done) {

    superagent
      .post(ASSETS.accountURI + '/public/auth/token/decode')
      .send({})
      .end(function (err, res) {
        res.statusCode.should.equal(400);

        should(res.body.data).be.undefined();
        res.body.error.name.should.equal('InvalidOption');
        res.body.error.option.should.equal('token');
        res.body.error.kind.should.equal('required');

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
      .post(ASSETS.accountURI + '/public/auth/token/decode')
      .send({
        token: deceitfulToken,
      })
      .end(function (err, res) {
        res.statusCode.should.equal(403);
        res.body.error.name.should.equal('InvalidToken');
        should(res.body.data).be.undefined();

        done();
      });
  });

  it('should properly decode a valid token', function (done) {
    // first create the token
    superagent
      .post(ASSETS.accountURI + '/public/auth/token/generate')
      .send({
        username: 'test-user',
        password: 'test-password'
      })
      .end(function (err, res) {
        if (err) { return done(err); }

        var token = res.body.data.token;

        superagent
          .post(ASSETS.accountURI + '/public/auth/token/decode')
          .send({
            token: token
          })
          .end(function (err, res) {
            if (err) { return done(err); }

            res.statusCode.should.equal(200);

            res.body.data.sub.should.be.instanceof(String)
            res.body.data.username.should.equal(ASSETS.users[0].username);
            res.body.data.iat.should.be.a.Number();
            res.body.data.exp.should.be.a.Number();
            res.body.data.status.value.should.eql('new');

            Object.keys(res.body.data).length.should.equal(5);

            done();
          });
      });
  });
});