// third-party
const Bluebird = require('bluebird');

const CONSTANTS = require('../shared/constants');

exports.migrate = function (hAccount, options) {

  var users = options.users;

  if (!users) {
    throw new Error('options.users is required');
  }

  var migratedAccounts = [];

  return hAccount.ready.then(() => {

    const AccountLock = hAccount.services.accountLock.models.Lock;
    const Account     = hAccount.services.mongoose.models.Account;

    return users.reduce((lastPromise, userData) => {

      return lastPromise.then(() => {
        var lock = new AccountLock({
          _hash: userData.bcryptPassword,
          meta: {
            migratedFromParse: true,
          }
        });

        return lock.save();
      })
      .then((lock) => {

        var account = new Account({
          name: userData.name,
          createdAt: userData.createdAt,
          verifiedAt: userData.updatedAt,
          username: userData.username,
          email: userData.email || userData.username,
          _accLockId: lock._id,

          meta: {
            parseObjectId: userData.objectId,
          },
        });

        account.setStatus(
          CONSTANTS.ACCOUNT_STATUSES.VERIFIED,
          'MigratedFromParse'
        );

        return account.save().then((account) => {
          migratedAccounts.push(account);

          console.log('.');
        });
      });

    }, Bluebird.resolve());

  })
  .then(() => {
    return 'Successfully migrated ' + migratedAccounts.length + ' user accounts';
  });

};

exports.undo = function (hAccount) {
  
};
