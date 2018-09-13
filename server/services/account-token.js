const Bluebird = require('bluebird');
const mongooseToken = require('@habemus/mongoose-token');

module.exports = function (app, options) {

  var accountToken = mongooseToken({
    tokenModelName: 'HAccountToken',
    issuer: 'h-account',
    mongooseConnection: app.services.mongoose.connection,
    secret: options.authSecret,
    defaultTokenExpiry: '30d',
  });

  return Bluebird.resolve(accountToken);

};
