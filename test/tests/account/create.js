// third-party dependencies
const should = require('should');
const superagent = require('superagent');

// auxiliary
const aux = require('../../auxiliary');

const hAccount = require('../../../server');

describe('User Account creation', function () {

  var ASSETS;

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
        done();
      })
      .catch(done);
  });

  afterEach(function (done) {
    aux.teardown().then(done).catch(done);
  });

  it('should require a username', function (done) {
    superagent
      .post(ASSETS.accountURI + '/public/accounts')
      .send({
        // username: 'test-user',
        email: 'test-user@dev.habem.us',
        password: 'test-password',
      })
      .end(function (err, res) {
        res.statusCode.should.equal(400);

        res.body.error.errors.length.should.equal(1);
        res.body.error.name.should.equal('InvalidOption');
        res.body.error.option.should.equal('username');
        res.body.error.kind.should.equal('required');

        done();
      });
  });

  it('should require an email', function (done) {
    superagent
      .post(ASSETS.accountURI + '/public/accounts')
      .send({
        username: 'test-user',
        // email: 'test-user@dev.habem.us',
        password: 'test-password'
      })
      .end(function (err, res) {
        res.statusCode.should.equal(400);

        res.body.error.errors.length.should.equal(1);
        res.body.error.name.should.equal('InvalidOption');
        res.body.error.option.should.equal('email');
        res.body.error.kind.should.equal('required');

        done();
      });
  });


  it('should require a password', function (done) {
    superagent
      .post(ASSETS.accountURI + '/public/accounts')
      .send({
        username: 'test-user',
        email: 'test-user@dev.habem.us',
        // password: 'test-password'
      })
      .end(function (err, res) {
        res.statusCode.should.equal(400);

        res.body.error.errors.length.should.equal(1);
        res.body.error.name.should.equal('InvalidOption');
        res.body.error.option.should.equal('password');
        res.body.error.kind.should.equal('required');

        done();
      });
  });

  it('should create a new user', function (done) {

    this.timeout(4000);

    superagent
      .post(ASSETS.accountURI + '/public/accounts')
      .send({
        username: 'test-user',
        email: 'testemail@dev.habem.us',
        password: 'test-password'
      })
      .end(function (err, res) {

        if (err) { return done(err); }

        res.statusCode.should.equal(201);

        res.body.data.username.should.equal('test-user');
        res.body.data.createdAt.should.be.a.String();

        ASSETS.db.collection('accounts').find().toArray((err, users) => {
          users.length.should.equal(1);

          users[0].username.should.equal('test-user');
          users[0]._accLockId.should.be.a.String();

          done();
        });
      });
  });

  // it('should enforce username uniqueness', function (done) {

  //   superagent
  //     .post(ASSETS.accountURI + '/public/accounts')
  //     .send({
  //       username: 'test-user',
  //       email: 'testemail@dev.habem.us',
  //       password: 'test-password'
  //     })
  //     .end(function (err, res) {

  //       if (err) { return done(err); }

  //       superagent
  //         .post(ASSETS.accountURI + '/public/accounts')
  //         .send({
  //           username: 'test-user',
  //           email: 'testemail@dev.habem.us',
  //           password: 'test-password',
  //         })
  //         .end(function (err, res) {
  //           res.statusCode.should.equal(400);

  //           done();
  //         });
  //     });
  // });
});