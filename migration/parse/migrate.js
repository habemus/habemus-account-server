// third-party
const Bluebird   = require('bluebird');
const envOptions = require('@habemus/env-options');

const usersData = require('./raw-data/_User.json').results;

var options = envOptions({
  apiVersion:       'pkg:version',
  corsWhitelist:    'list:CORS_WHITELIST',
  fromEmail:        'env:FROM_EMAIL',

  mongodbURI:       'env:MONGODB_URI',
  rabbitMQURI:      'env:RABBIT_MQ_URI',

  publicHostURI:    'env:PUBLIC_HOST_URI',
  uiHostURI:        'env:UI_HOST_URI',

  authSecret:       'env:AUTH_SECRET',

  enablePrivateAPI: 'bool?:ENABLE_PRIVATE_API',
  privateAPISecret: 'env?:PRIVATE_API_SECRET',
});

const createHAccount = require('../../server');

var hAccount = createHAccount(options);

hAccount.ready.then(() => {
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
        username: userData.username,
        email: userData.email || userData.username,
        _accLockId: lock._id,
      });

      account.setStatus('new', 'Migrated');

      return account.save();
    });

  }, Bluebird.resolve());

})
.catch((err) => {
  console.warn('error', err);
});
