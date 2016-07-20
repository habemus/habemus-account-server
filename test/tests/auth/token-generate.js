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

  it('should require username', function (done) {
    superagent
      .post(ASSETS.authURI + '/auth/token/generate')
      .send({
        username: undefined,
        password: 'test-password'
      })
      .end(function (err, res) {
        res.statusCode.should.equal(400);

        should(res.body.data).be.undefined();
        res.body.error.name.should.equal('InvalidOption');
        res.body.error.option.should.equal('usernameOrEmail');
        res.body.error.kind.should.equal('required');

        done();
      });
  });

  it('should require password', function (done) {
    superagent
      .post(ASSETS.authURI + '/auth/token/generate')
      .send({
        username: 'test-user',
        password: undefined
      })
      .end(function (err, res) {
        res.statusCode.should.equal(400);

        should(res.body.data).be.undefined();
        res.body.error.name.should.equal('InvalidOption');
        res.body.error.option.should.equal('password');
        res.body.error.kind.should.equal('required');

        done();
      });
  });

  it('should not generate a token if credentials are not valid', function (done) {
    superagent
      .post(ASSETS.authURI + '/auth/token/generate')
      .send({
        username: 'test-user',
        password: 'wrong-password'
      })
      .end(function (err, res) {

        res.statusCode.should.equal(401);

        should(res.body.data).be.undefined();
        res.body.error.name.should.equal('InvalidCredentials');

        done();
      });
  });

  it('should respond with the exact same error code if the username is not found', function (done) {
    superagent
      .post(ASSETS.authURI + '/auth/token/generate')
      .send({
        username: 'wrong-user',
        password: 'wrong-password'
      })
      .end(function (err, res) {

        res.statusCode.should.equal(401);

        should(res.body.data).be.undefined();
        res.body.error.name.should.equal('InvalidCredentials');

        done();
      });
  });

  it('should generate a JWT given the right credentials', function (done) {
    superagent
      .post(ASSETS.authURI + '/auth/token/generate')
      .send({
        username: 'test-user',
        password: 'test-password'
      })
      .end(function (err, res) {
        if (err) { return done(err); }

        res.statusCode.should.equal(201);
        res.body.data.token.should.be.a.String();

        // check the data that is inside the token
        var decoded = jwt.verify(res.body.data.token, 'fake-secret');

        // be sure that all properties are known
        decoded.sub.should.be.instanceof(String);
        decoded.username.should.equal(ASSETS.users[0].username);
        decoded.createdAt.should.be.a.String();

        decoded.iat.should.be.a.Number();
        decoded.exp.should.be.a.Number();
        decoded.jti.should.be.a.String();
        decoded.iss.should.equal('h-auth');

        Object.keys(decoded).length.should.equal(7);

        done();
      });
  });

});