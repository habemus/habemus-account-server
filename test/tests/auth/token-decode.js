// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const stubTransort = require('nodemailer-stub-transport');
const jwt        = require('jsonwebtoken');

// auxiliary
const aux = require('../../auxiliary');

const createHAuth = require('../../../server');

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

        ASSETS.authApp = createHAuth(options);
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

  it('should require a token to be sent for decoding', function (done) {

    superagent
      .post(ASSETS.authURI + '/auth/token/decode')
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
      .post(ASSETS.authURI + '/auth/token/decode')
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
      .post(ASSETS.authURI + '/auth/token/generate')
      .send({
        username: 'test-user',
        password: 'test-password'
      })
      .end(function (err, res) {
        if (err) { return done(err); }

        var token = res.body.data.token;

        superagent
          .post(ASSETS.authURI + '/auth/token/decode')
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

            Object.keys(res.body.data).length.should.equal(4);

            done();
          });
      });
  });
});