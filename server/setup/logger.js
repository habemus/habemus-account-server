// third-party dependencies
const morgan = require('morgan');

var defaultLogger = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
};

module.exports = function (app, options) {

  app.use(morgan('dev'));

  app.log = options.logger || defaultLogger;
};