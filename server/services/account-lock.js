// third-party
const Bluebird = require('bluebird');
const hLock    = require('h-lock');

module.exports = function (app, options) {

  var accountLock = hLock({
    lockModelName: 'HAccountAccountLock',
    mongooseConnection: app.services.mongoose.connection,
    maxUnlockFailures: 30,
    unlockFailureCooldownCount: 20,
  });

  return Bluebird.resolve(accountLock);
};
