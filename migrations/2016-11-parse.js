// third-party
const Bluebird = require('bluebird');

const CONSTANTS = require('../shared/constants');

const FILTERED_ACCOUNTS = [
  'Barbaravioto@GMAIL.COM', // Email seems to be duplicated and has never seen the intro guides
  'hab.RTY@XOXY.NET',       // Email seems to be spammy and has never seen the intro guides
];

exports.migrate = function (hAccount, options) {

  var users = options.users;

  if (!users) {
    throw new Error('options.users is required');
  }

  // filter out emailVerified === false
  // filter out exception cases.
  users = users.filter((user) => {

    if (FILTERED_ACCOUNTS.indexOf(user.email) !== -1 ||
        FILTERED_ACCOUNTS.indexOf(user.username) !== -1) {
      // this e-mail is duplicated
      // and the corresponding barbaravioto@gmail.com account
      // is in use
      // We might need to do manual migrations here
      return false;
    }

    return user.emailVerified !== false;
  }).reverse();

  var migratedAccounts = [];
  var errorAccounts    = [];

  return hAccount.ready.then(() => {

    const AccountLock = hAccount.services.accountLock.models.Lock;
    const Account     = hAccount.services.mongoose.models.Account;

    return users.reduce((lastPromise, userData) => {


      var _userLock;

      return lastPromise.then(() => {
        var lock = new AccountLock({
          _hash: userData._hashed_password,
          meta: {
            migratedFromParse: true,
          }
        });

        return lock.save();
      })
      .then((lock) => {

        _userLock = lock;

        var nameSplit = userData.name.split(/\s+/);

        var givenName = nameSplit[0];
        var familyName = nameSplit.length > 1 ? nameSplit[nameSplit.length - 1] : undefined;
        var additionalName;
        if (nameSplit.length > 2) {
          additionalName = nameSplit.reduce((res, name, index) => {

            var isFirst = index === 0;
            var isLast  = index === nameSplit.length - 1;

            if (!isFirst && !isLast) {
              res.push(name);
            }

            return res;

          }, []).join(' ');
        }

        var account = new Account({
          ownerData: {
            givenName: givenName,
            familyName: familyName,
            additionalName: additionalName,
          },
          createdAt: userData.createdAt,
          verifiedAt: userData.updatedAt,
          username: userData.username,
          email: userData.email || userData.username,
          _accLockId: lock._id,

          legal: {
            termsOfService: {
              agreed: true,
              version: 'v1',
            },
          },

          meta: {
            parseObjectId: userData._id,
          },
        });

        account.setStatus(
          CONSTANTS.ACCOUNT_STATUSES.VERIFIED,
          'MigratedFromParse'
        );

        return account.save().then((account) => {
          migratedAccounts.push(account);

          console.log('created account ' + account.username);
        })
        .catch((err) => {
          console.log('failed creating account ', err);

          errorAccounts.push({
            error: err,
            account: account,
          });

          return _userLock.remove();
        });
      });

    }, Bluebird.resolve());

  })
  .then(() => {

    console.log('Successfully migrated ' + migratedAccounts.length + ' user accounts');

    if (errorAccounts.length > 0) {
      console.warn('=== FAILED ===');
      console.warn(JSON.stringify(errorAccounts, null, '  '));
      console.warn('=== FAILED ===')
    }

    return 'Successfully migrated ' + migratedAccounts.length + ' user accounts';
  })
  .catch((err) => {
    console.warn('error migrating', err);
  });

};

exports.undo = function (hAccount) {
  
};
