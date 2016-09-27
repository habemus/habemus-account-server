// third-party
const Bluebird = require('bluebird');
const hLock    = require('h-lock');

module.exports = function (app, options) {

  var accountLock = hLock({
    lockModelName: 'HAccountAccountLock',
    mongooseConnection: app.services.mongoose.connection,
  });

  return Bluebird.resolve(accountLock);
};
