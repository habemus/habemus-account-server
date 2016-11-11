// third-party
const Bluebird = require('bluebird');

const CONSTANTS = require('../../../shared/constants');

const usersData = require('./raw-data/_User.json').results;

module.exports = function (hAccount) {

  return hAccount.ready.then(() => {
    console.log('hAccount ready');

    const AccountLock = hAccount.services.accountLock.models.Lock;
    const Account     = hAccount.services.mongoose.models.Account;

    return usersData.reduce((lastPromise, userData) => {

      return lastPromise.then(() => {

        var lock = new AccountLock({
          _hash: userData.bcryptPassword,
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

        return account.save();
      });

    }, Bluebird.resolve());

  })
  .then(() => {
    console.log('migration succeeded');
  })
  .catch((err) => {
    console.warn('error', err);
  });

};
