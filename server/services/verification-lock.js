// third-party
const Bluebird = require('bluebird');
const hLock    = require('h-lock');

module.exports = function (app, options) {

  var verificationLock = hLock({
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
