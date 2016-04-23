// third-party dependencies
const should = require('should');
const superagent = require('superagent');

// test-specific dependencies
const testServer = require('../../auxiliary/server');


describe('POST /users', function () {

  const URI = testServer.uri + '/users';

  before(function (done) {
    // start listening
    testServer.start(done);
  });

  after(function (done) {
    // start listening
    testServer.stop(done);
  });

  it('should require a username', function (done) {
    superagent
      .post(URI)
      .send({
        password: 'test-password'
      })
      .end(function (err, res) {
        res.statusCode.should.equal(400);
        done();
      });
  });

  it('should require a password', function (done) {
    superagent
      .post(URI)
      .send({
        username: 'test-user'
      })
      .end(function (err, res) {
        res.statusCode.should.equal(400);
        done();
      });
  });

  it('should create a new user', function (done) {

    this.timeout(5000);

    superagent
      .post(URI)
      .send({
        username: 'test-user',
        password: 'test-password'
      })
      .end(function (err, res) {

        if (err) { return done(err); }

        res.statusCode.should.equal(201);

        res.body.data.username.should.equal('test-user');
        res.body.data.createdAt.should.be.a.String();

        testServer.db.collection('users').find().toArray((err, users) => {
          users.length.should.equal(1);

          users[0].username.should.equal('test-user');
          users[0].hash.should.be.a.String();

          done();
        });
      });
  });

  it('should enforce username uniqueness', function (done) {
    superagent
      .post(testServer.uri + '/users')
      .send({
        username: 'test-user',
        password: 'test-password',
      })
      .end(function (err, res) {
        res.statusCode.should.equal(400);

        done();
      });
  });

});