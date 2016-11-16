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
            familyName: familyName
            additionalName: additionalName,
          },
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
