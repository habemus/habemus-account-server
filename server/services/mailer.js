// third-party
const Bluebird = require('bluebird');

const MailerClient = require('habemus-platform-mailer/client');

module.exports = function (app, options) {

  var hMailer = new MailerClient();

  return hMailer.connect(app.services.rabbitMQ.connection)
    .then(() => {

      console.log('hMailer connected')
      
      hMailer.on('result:success', function (mailRequestId, report) {
        app.services.log.info('mail sent with success', mailRequestId, report);
      });
      hMailer.on('result:error', function (mailRequestId, report) {
        app.services.log.error('error sending mail', mailRequestId, report);
      });

      return hMailer;
    });
};
