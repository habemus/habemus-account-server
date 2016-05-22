// third-party dependencies
const cors        = require('cors');
const jsonMessage = require('json-message');

module.exports = function (app, options) {

  ////
  // CORS
  var corsWhitelist = options.corsWhitelist || [];
  corsWhitelist = (typeof corsWhitelist === 'string') ?
    corsWhitelist.split(',') : corsWhitelist;

  app.log.info('cors whitelist', corsWhitelist);

  var _corsMiddleware = cors({
    origin: function (origin, cb) {
      var originIsWhitelisted = (corsWhitelist.indexOf(origin) !== -1);

      if (!originIsWhitelisted) {
        app.log.warn('request from not-whitelisted origin %s', origin, corsWhitelist);
      }

      cb(null, originIsWhitelisted);
    }
  });

  app.options('*', _corsMiddleware);
  app.use(_corsMiddleware);


  ////
  // JSON MESSAGE
  var jsonM = jsonMessage(options.apiVersion);

  app.format = {};
  app.format.item = function (sourceData, dataMap) {
    var msg = jsonM.response.item();

    msg.load(sourceData, dataMap);

    return msg;
  };

  app.format.list = function (sourceData, dataMap) {
    var msg = jsonM.response.list();

    msg.load(sourceData, dataMap);

    return msg;
  };

  app.format.error = function (code, message, data) {
    var msg = jsonM.response.item();

    msg.err(code, message, data);

    return msg;
  };
};