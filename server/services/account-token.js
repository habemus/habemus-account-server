const Bluebird = require('bluebird');
const hToken   = require('h-token');

module.exports = function (app, options) {

  var accountToken = hToken({
    tokenModelName: 'HAccountToken',
    issuer: 'h-account',
    mongooseConnection: app.services.mongoose.connection,
    secret: options.authSecret,
    defaultTokenExpiry: '30d',
  });

  return Bluebird.resolve(accountToken);

};
