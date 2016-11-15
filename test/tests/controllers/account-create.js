// third-party dependencies
const should = require('should');
const superagent = require('superagent');

// auxiliary
const aux = require('../../auxiliary');

const hAccount = require('../../../server');

describe('accountCtrl.create(userData)', function () {

  var ASSETS;

  beforeEach(function () {
    return aux.setup()
      .then((assets) => {
        ASSETS = assets;

        ASSETS.accountApp = hAccount(aux.genOptions());

        return ASSETS.accountApp.ready;
      });
  });

  afterEach(function () {
    this.timeout(4000);
    return aux.teardown();
  });

  it('should create an account', function () {
      
    return ASSETS.accountApp.controllers.account.create({
      username: 'test-user',
      password: 'test-password',
      email: 'test-user@dev.habem.us',

      ownerData: {
        givenName: 'João',
        familyName: 'Sauro',
        additionalName: 'Silva',
      }
    })
    .then((account) => {

      account.createdAt.should.be.instanceof(Date);
      account.status.value.should.equal('new');

      account.username.should.equal('test-user');
      account.email.should.equal('test-user@dev.habem.us');

      // rough test checking if the account's password is stored in the db
      var pwdMatch = JSON.stringify(account).match(/test-password/);

      if (pwdMatch) {
        throw new Error('password found in account data');
      }
    })
    .catch(aux.logError);
  });

  it('should require username', function () {
    return ASSETS.accountApp.controllers.account.create({
      // username: 'test-user',
      password: 'test-password',
      email: 'test-user@dev.habem.us',
      ownerData: {
        givenName: 'João',
        familyName: 'Sauro',
        additionalName: 'Silva',
      }
    })
    .then(aux.errorExpected, (err) => {
      err.name.should.equal('InvalidOption');
      err.option.should.equal('username');
      err.kind.should.equal('required');
    });
  });

  it('should require a password', function () {
    return ASSETS.accountApp.controllers.account.create({
      username: 'test-user',
      // password: 'test-password',
      email: 'test-user@dev.habem.us',
      ownerData: {
        givenName: 'João',
        familyName: 'Sauro',
        additionalName: 'Silva',
      }
    })
    .then(aux.errorExpected, (err) => {
      err.name.should.equal('InvalidOption');
      err.option.should.equal('password');
      err.kind.should.equal('required');
    });
  });

  it('should require an email', function () {
    return ASSETS.accountApp.controllers.account.create({
      username: 'test-user',
      password: 'test-password',
      // email: 'test-user@dev.habem.us',
      ownerData: {
        givenName: 'João',
        familyName: 'Sauro',
        additionalName: 'Silva',
      }
    })
    .then(aux.errorExpected, (err) => {
      err.name.should.equal('InvalidOption');
      err.option.should.equal('email');
      err.kind.should.equal('required');
    });
  });

  it('should require a valid account email', function () {
    return ASSETS.accountApp.controllers.account.create({
      username: 'test-user',
      password: 'test-password',
      email: 'not-an-email@',
      ownerData: {
        givenName: 'João',
        familyName: 'Sauro',
        additionalName: 'Silva',
      }
    })
    .then(aux.errorExpected, (err) => {
      err.name.should.equal('InvalidOption');
      err.option.should.equal('email');
      err.kind.should.equal('invalid');
    });
  });

  describe('username uniqueness', function () {

    it('should prevent two accounts with the same username from being created', function () {
        
      var _account1;
      var _account2;

      return ASSETS.accountApp.controllers.account.create({
        username: 'test-user',
        password: 'test-password',
        email: 'test-user@dev.habem.us',
        ownerData: {
          givenName: 'João',
          familyName: 'Sauro',
          additionalName: 'Silva',
        }
      })
      .then((account1) => {
        _account1 = account1;

        return ASSETS.accountApp.controllers.account.create({
          username: 'test-user',
          password: 'another-password',
          email: 'another-email-user@dev.habem.us',
          ownerData: {
            givenName: 'João',
            familyName: 'Sauro',
            additionalName: 'Silva',
          }
        })
      })
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('UsernameTaken');
        err.username.should.equal('test-user');
      });
    });
  });

  describe('email uniqueness', function () {

    it('should prevent two accounts with the same email from being created', function () {

      var _account1;
      var _account2;

      return ASSETS.accountApp.controllers.account.create({
        username: 'test-user',
        password: 'test-password',
        email: 'same-email@dev.habem.us',
        ownerData: {
          givenName: 'João',
          familyName: 'Sauro',
          additionalName: 'Silva',
        }
      })
      .then((account) => {
        _account1 = account;

        return ASSETS.accountApp.controllers.account.create({
          username: 'another-user',
          password: 'another-password',
          email: 'same-email@dev.habem.us',
          ownerData: {
            givenName: 'João',
            familyName: 'Sauro',
            additionalName: 'Silva',
          }
        });
      })
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('EmailTaken');
        err.email.should.equal('same-email@dev.habem.us');
      });
    });

  });

});
