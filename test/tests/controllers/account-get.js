// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const Bluebird = require('bluebird');

// auxiliary
const aux = require('../../auxiliary');

const hAccount = require('../../../server');

describe('accountCtrl `get` methods', function () {

  var ASSETS;

  beforeEach(function (done) {
    aux.setup()
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
        
      })
      .then((users) => {

        ASSETS.users = users;

        done();
      })
      .catch(done);
  });

  afterEach(function () {
    this.timeout(5000);
    return aux.teardown();
  });

  describe('accountCtrl.getByUsername(username)', function () {
    it('should retrieve the user by its username', function () {
      return ASSETS.accountApp.controllers.account.getByUsername('test-user-1')
        .then((user) => {
          user.username.should.equal('test-user-1');
          user.email.should.equal('test-1@dev.habem.us');
        });
    });

    it('should return error if username does not exist', function () {
      return ASSETS.accountApp.controllers.account.getByUsername('fake-username')
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('UserNotFound');
          err.identifier.should.equal('fake-username');
        });
    });

    it('should require username as first argument', function () {
      return ASSETS.accountApp.controllers.account.getByUsername(undefined)
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('username');
          err.kind.should.equal('required');
        });
    });
  });

  describe('accountCtrl.getByEmail(email)', function () {
    it('should retrieve the user by its username', function () {
      return ASSETS.accountApp.controllers.account.getByEmail('test-2@dev.habem.us')
        .then((user) => {
          user.username.should.equal('test-user-2');
          user.email.should.equal('test-2@dev.habem.us');
        });
    });

    it('should return error if email does not exist', function () {
      return ASSETS.accountApp.controllers.account.getByEmail('fake-email@dev.habem.us')
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('UserNotFound');
          err.identifier.should.equal('fake-email@dev.habem.us');
        });
    });

    it('should require email as first argument', function () {
      return ASSETS.accountApp.controllers.account.getByEmail(undefined)
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('email');
          err.kind.should.equal('required');
        });
    });
  });
  

  describe('accountCtrl.getById(id)', function () {
    it('should retrieve the user by its username', function () {
      return ASSETS.accountApp.controllers.account.getById(ASSETS.users[1]._id)
        .then((user) => {
          user.username.should.equal('test-user-2');
          user.email.should.equal('test-2@dev.habem.us');
        });
    });

    it('should return error if _id does not exist', function () {
      return ASSETS.accountApp.controllers.account.getById('578e8e7dae522ad62c4ee9ae')
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('UserNotFound');
          err.identifier.should.equal('578e8e7dae522ad62c4ee9ae');
        });
    });

    it('should require _id as first argument', function () {
      return ASSETS.accountApp.controllers.account.getById(undefined)
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('id');
          err.kind.should.equal('required');
        });
    });
  });
  

  describe('accountCtrl.getByUsernameOrEmail(usernameOrEmail)', function () {
    it('should retrieve the user by its username if given the username', function () {
      return ASSETS.accountApp.controllers.account.getByUsernameOrEmail(ASSETS.users[1].username)
        .then((user) => {
          user.username.should.equal('test-user-2');
          user.email.should.equal('test-2@dev.habem.us');
        });
    });

    it('should retrieve the user by its email if given the email', function () {
      return ASSETS.accountApp.controllers.account.getByUsernameOrEmail(ASSETS.users[1].email)
        .then((user) => {
          user.username.should.equal('test-user-2');
          user.email.should.equal('test-2@dev.habem.us');
        });
    });

    it('should attempt to get user by email if argument passed looks like email and upon UserNotFound error, attempt to get the user by its username', function () {
      
      // create a user that has an 'email'-like username
      return ASSETS.accountApp.controllers.account.create({
          username: 'email-like@username.com',
          email: 'some-email@dev.habem.us',
          password: 'test-password',
        })
        .then((user) => {
          return ASSETS.accountApp.controllers.account.getByUsernameOrEmail('email-like@username.com')
        })
        .then((user) => {
          user.username.should.equal('email-like@username.com');
          user.email.should.equal('some-email@dev.habem.us');
        });
    });
    
    it('should require usernameOrEmail as first argument', function () {
      return ASSETS.accountApp.controllers.account.getByUsernameOrEmail(undefined)
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('usernameOrEmail');
          err.kind.should.equal('required');
        });
    });
  });

});
