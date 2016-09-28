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
    })
    .then((account) => {

      account.createdAt.should.be.instanceof(Date);
      account.status.value.should.equal('unverified');

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
    })
    .then(aux.errorExpected, (err) => {
      err.name.should.equal('InvalidOption');
      err.option.should.equal('email');
      err.kind.should.equal('invalid');
    });
  });

  it('should prevent creation of an account with duplicate username', function () {
      
    return ASSETS.accountApp.controllers.account.create({
      username: 'test-user',
      password: 'test-password',
      email: 'test-user@dev.habem.us',
    })
    .then((account) => {
      return ASSETS.accountApp.controllers.account.create({
        username: 'test-user',
        password: 'another-password',
        email: 'another-email-user@dev.habem.us',
      })
    })
    .then(aux.errorExpected, (err) => {
      err.name.should.equal('UsernameTaken');
      err.username.should.equal('test-user');
    });
  });

  it('should prevent creation of an account with duplicate email', function () {
      
    return ASSETS.accountApp.controllers.account.create({
      username: 'test-user',
      password: 'test-password',
      email: 'test-user@dev.habem.us',
    })
    .then((account) => {
      return ASSETS.accountApp.controllers.account.create({
        username: 'another-user',
        password: 'another-password',
        email: 'test-user@dev.habem.us',
      })
    })
    .then(aux.errorExpected, (err) => {
      err.name.should.equal('EmailTaken');
      err.email.should.equal('test-user@dev.habem.us');
    });
  });
    
});
