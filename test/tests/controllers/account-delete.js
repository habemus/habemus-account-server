// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const Bluebird = require('bluebird');

// auxiliary
const aux = require('../../auxiliary');

const hAccount = require('../../../server');

describe('accountCtrl.delete(username)', function () {

  var ASSETS;

  beforeEach(function () {
    return aux.setup()
      .then((assets) => {
        ASSETS = assets;
        
        ASSETS.accountApp = hAccount(aux.genOptions());

        return ASSETS.accountApp.ready;
      })
      .then(() => {

        // create some users
        var create1 = ASSETS.accountApp.controllers.account.create({
          username: 'test-user-1',
          email: 'test-1@dev.habem.us',
          password: 'test-password',
        });
        var create2 = ASSETS.accountApp.controllers.account.create({
          username: 'test-user-2',
          email: 'test-2@dev.habem.us',
          password: 'test-password',
        });
        var create3 = ASSETS.accountApp.controllers.account.create({
          username: 'test-user-3',
          email: 'test-3@dev.habem.us',
          password: 'test-password',
        });

        return Bluebird.all([
          create1,
          create2,
          create3
        ]);
        
      });
  });

  afterEach(function () {
    this.timeout(5000);
    return aux.teardown();
  });

  it('should delete an account from the database', function () {

    return ASSETS.accountApp.controllers.account.delete('test-user-2')
      .then(() => {
        arguments.length.should.equal(0);

        return new Promise((resolve, reject) => {
          ASSETS.db
          .collection('accounts')
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
      .then((accounts) => {
        accounts.length.should.equal(2);

        accounts.forEach((account) => {
          account.username.should.not.equal('test-user-2');
        });
      });

  });

  it('should require username as the first argument', function () {
    return ASSETS.accountApp.controllers.account.delete(undefined)
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidOption');
        err.option.should.equal('username');
        err.kind.should.equal('required');
      });
  });
    
});
