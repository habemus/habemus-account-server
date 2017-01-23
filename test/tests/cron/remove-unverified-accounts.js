// third-party dependencies
const should = require('should');

// auxiliary
const aux = require('../../auxiliary');

const hAccount = require('../../../server');

describe('Cron job: remove unverified accounts', function () {
  var ASSETS;

  beforeEach(function (done) {
    aux.setup()
      .then((assets) => {
        ASSETS = assets;
        
        ASSETS.accountApp = hAccount(aux.genOptions({

          // account verification should last at least 10s
          accountVerificationDuration: '10s',

          // run the job every second (for test purposes)
          cronRemoveUnverifiedAccounts: '* * * * * *',
        }));
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

  it('should remove unverified accounts after the accountVerificationDuration period has passed', function () {

    this.timeout(60 * 1000);

    var _account;

    return ASSETS.accountApp.controllers.account.create({
      username: 'test-user',
      password: 'test-password',
      email: 'test-user@dev.habem.us',

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
    })
    .then((account) => {
      _account = account;

      console.log('created account ', account);

      // wait 5 seconds, so that the account is still be in verification 
      // (accountVerificationDuration is 10 seconds)
      return aux.wait(5 * 1000);

    })
    .then(() => {

      return ASSETS.accountApp.services.mongoose.models.Account.find();
    })
    .then((accounts) => {
      accounts.length.should.eql(1);

      // wait more 10 seconds so that since the account was created more than 15 seconds
      // have passed
      // the cron job is run every second in this test
      return aux.wait(10 * 1000);
    })
    .then(() => {

      return ASSETS.accountApp.services.mongoose.models.Account.find();
    })
    .then((accounts) => {
      accounts.length.should.eql(0);
    });
  });
});