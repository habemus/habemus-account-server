// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const stubTransort = require('nodemailer-stub-transport');
const Bluebird = require('bluebird');

// auxiliary
const aux = require('../../auxiliary');

const createHAuth = require('../../../server');

describe('userCtrl.delete(username)', function () {

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

        // create some users
        var create1 = ASSETS.authApp.controllers.user.create({
          username: 'test-user-1',
          email: 'test-1@dev.habem.us',
          password: 'test-password',
        });
        var create2 = ASSETS.authApp.controllers.user.create({
          username: 'test-user-2',
          email: 'test-2@dev.habem.us',
          password: 'test-password',
        });
        var create3 = ASSETS.authApp.controllers.user.create({
          username: 'test-user-3',
          email: 'test-3@dev.habem.us',
          password: 'test-password',
        });

        return Bluebird.all([
          create1,
          create2,
          create3
        ]);
        
      })
      .then(() => {

        done();
      })
      .catch(done);
  });

  afterEach(function (done) {
    aux.teardown().then(done).catch(done);
  });

  it('should delete a user from the database', function () {

    return ASSETS.authApp.controllers.user.delete('test-user-2')
      .then(() => {
        arguments.length.should.equal(0);

        return new Promise((resolve, reject) => {
          ASSETS.db
          .collection('users')
          .find()
          .toArray((err, res) => {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          });
        })
      })
      .then((users) => {
        users.length.should.equal(2);

        users.forEach((user) => {
          user.username.should.not.equal('test-user-2');
        });
      });

  });

  it('should require username as the first argument', function () {
    return ASSETS.authApp.controllers.user.delete(undefined)
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidOption');
        err.option.should.equal('username');
        err.kind.should.equal('required');
      });
  });
    
});
