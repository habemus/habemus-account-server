// third-party
const Bluebird = require('bluebird');
const mongooseLock = require('@habemus/mongoose-lock');

module.exports = function (app, options) {

  var verificationLock = mongooseLock({
    lockModelName: 'HAccountAuxiliaryLock',
    mongooseConnection: app.services.mongoose.connection,

    /**
     * Let the lock be discarded once it has been successfully unlocked
     * @type {Boolean}
     */
    discardAfterUnlock: true
  });
  
  return Bluebird.resolve(verificationLock);
};
