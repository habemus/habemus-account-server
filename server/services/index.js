// third-party
const Bluebird = require('bluebird');

module.exports = function (app, options) {
  
  return Bluebird.all([
    require('./mongoose')(app, options),
    require('./log')(app, options),
    require('./message-api')(app, options),
    require('./rabbit-mq')(app, options),
  ])
  .then((services) => {

    app.services = {};

    app.services.mongoose   = services[0];
    app.services.log        = services[1];
    app.services.messageAPI = services[2];
    app.services.rabbitMQ   = services[3];

    // second batch of services
    // h-mailer requires the rabbitMQ connection to be ready
    // 
    // account-token requires mongoose
    // account-lock requires mongoose
    // verification-lock requires mongoose
    return Bluebird.all([
      require('./h-mailer')(app, options),
      require('./account-token')(app, options),
      require('./account-lock')(app, options),
      require('./verification-lock')(app, options),
    ]);
  })
  .then((services) => {

    app.services.hMailer          = services[0];
    app.services.accountToken     = services[1];
    app.services.accountLock      = services[2];
    app.services.verificationLock = services[3];

    return;
  });
};
