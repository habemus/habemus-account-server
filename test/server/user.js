// third-party dependencies
const should = require('should');
const superagent = require('superagent');

// test-specific dependencies
const server = require('../auxiliary/server');


describe('POST /users', function () {

  beforeEach(function (done) {
    // start listening
    server.start(done);
  });

  afterEach(function (done) {

    // start listening
    server.stop(done);
  })

  it('should create a new user', function (done) {

    superagent
      .post(server.uri + '/users')
      .send({
        username: 'test-user',
        password: 'test-password'
      })
      .end(function (err, res) {

        if (err) {
          done(err);
          return;
        }

        res.statusCode.should.equal(201);

        done();
      });
  });

});