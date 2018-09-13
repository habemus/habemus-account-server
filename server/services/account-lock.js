// third-party
const Bluebird = require('bluebird');
const mongooseLock = require('@habemus/mongoose-lock');

module.exports = function (app, options) {

  var accountLock = mongooseLock({
    lockModelName: 'HAccountAccountLock',
    mongooseConnection: app.services.mongoose.connection,
    maxUnlockFailures: 30,
    unlockFailureCooldownCount: 20,
  });

  return Bluebird.resolve(accountLock);
};
