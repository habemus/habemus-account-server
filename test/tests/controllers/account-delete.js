// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const Bluebird = require('bluebird');
const mongoose = require('mongoose');

// auxiliary
const aux = require('../../auxiliary');

const hAccount = require('../../../server');

describe('accountCtrl.delete(account)', function () {

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
          ownerData: {
            givenName: 'João',
            familyName: 'Sauro',
            additionalName: 'Silva',
          },
          legal: {
            termsOfService: {
              agreed: true,
            }
          }
        });
        var create2 = ASSETS.accountApp.controllers.account.create({
          username: 'test-user-2',
          email: 'test-2@dev.habem.us',
          password: 'test-password',
          ownerData: {
            givenName: 'João',
            familyName: 'Sauro',
            additionalName: 'Silva',
          },
          legal: {
            termsOfService: {
              agreed: true,
            }
          }
        });
        var create3 = ASSETS.accountApp.controllers.account.create({
          username: 'test-user-3',
          email: 'test-3@dev.habem.us',
          password: 'test-password',
          ownerData: {
            givenName: 'João',
            familyName: 'Sauro',
            additionalName: 'Silva',
          },
          legal: {
            termsOfService: {
              agreed: true,
            }
          }
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

  it('should delete an account and all associated resources from the database', function () {

    var _account;

    return ASSETS.accountApp.controllers.account.getByUsername('test-user-2')
      .then((account) => {
        _account = account;
        return ASSETS.accountApp.controllers.account.delete(account);
      })
      .then(() => {
        arguments.length.should.equal(0);

        var accountsPromise = new Promise((resolve, reject) => {
          ASSETS.db
          .collection('accounts')
          .find({
            _id: _account._id,
          })
          .toArray((err, res) => {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          });
        });

        var locksPromise = new Promise((resolve, reject) => {
          ASSETS.db
          .collection('haccountaccountlocks')
          .find({
            _id: new require('mongodb').ObjectID(_account._accLockId),
          })
          .toArray((err, res) => {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          });
        });

        var protectedRequestsPromise = new Promise((resolve, reject) => {
          ASSETS.db
          .collection('protectedactionrequests')
          .find({
            userId: _account._id,
          })
          .toArray((err, res) => {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          });
        });

        return Promise.all([
          accountsPromise,
          locksPromise,
          protectedRequestsPromise
        ]);
      })
      .then((results) => {
        var accounts = results[0];
        var accountLocks = results[1];
        var protectedActionRequests = results[2];

        accounts.length.should.equal(0);
        accountLocks.length.should.equal(0);

        protectedActionRequests.forEach((req) => {
          req.status.value.should.eql('cancelled');
          req.status.reason.should.eql('AccountDeleted');
        });
      });

  });

  it('should require account as the first argument', function () {
    return ASSETS.accountApp.controllers.account.delete(undefined)
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidOption');
        err.option.should.equal('account');
        err.kind.should.equal('required');
      });
  });
    
});
