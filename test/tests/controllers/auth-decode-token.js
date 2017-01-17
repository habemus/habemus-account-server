// third-party dependencies
const should = require('should');
const superagent = require('superagent');
const Bluebird = require('bluebird');
const jwt = require('jsonwebtoken');
const uuid = require('node-uuid');

// auxiliary
const aux = require('../../auxiliary');

const hAccount = require('../../../server');

describe('authCtrl.decodeToken(token)', function () {

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
          password: 'test-password-1',
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
          password: 'test-password-2',
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
          password: 'test-password-3',
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

  it('should verify validity of a token and return its decoded contents', function () {
    return ASSETS.accountApp.controllers.auth
      .generateToken('test-user-1', 'test-password-1')
      .then((token) => {
        return ASSETS.accountApp.controllers.auth
          .decodeToken(token);
      })
      .then((decoded) => {
        Object.keys(decoded).length.should.equal(7);

        decoded.createdAt.should.be.instanceof(String);
        decoded.username.should.equal('test-user-1');
        
        decoded.iat.should.be.instanceof(Number);
        decoded.exp.should.be.instanceof(Number);
        decoded.iss.should.equal('h-account');
        // sub should be equal to the username
        decoded.sub.should.equal(ASSETS.users[0]._id);
        decoded.jti.should.be.instanceof(String);
      });
  });

  it('should fail to verify validity of a forged token', function () {

    var forgedToken = jwt.sign({}, 'forged-fake-secret', {
      expiresIn: '10h',
      issuer: 'h-auth',
      subject: uuid.v4(),
    });

    return ASSETS.accountApp.controllers.auth
      .decodeToken(forgedToken)
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidToken');
      });
  });

  it('should require the token to be passed as first argument', function () {
    return ASSETS.accountApp.controllers.auth.decodeToken(undefined)
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidOption');
        err.option.should.equal('token');
        err.kind.should.equal('required');
      });
  });
});
