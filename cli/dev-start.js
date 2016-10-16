// native dependencies
const http = require('http');

// internal dependencies
const pkg = require('../package.json');
const createHabemusAuth = require('../');

var options = {
  apiVersion: pkg.version,
  port: process.env.PORT,
  mongodbURI: process.env.MONGODB_URI,
  rabbitMQURI: process.env.RABBIT_MQ_URI,
  secret: process.env.SECRET,

  fromEmail: process.env.FROM_EMAIL,
  publicHostURI: process.env.PUBLIC_HOST_URI,
  uiHostURI: process.env.UI_HOST_URI,

  corsWhitelist: process.env.CORS_WHITELIST,
};

// instantiate the app
var app = createHabemusAuth(options);

// create http server and pass express app as callback
var server = http.createServer(app);

// start listening
server.listen(options.port, function () {
  console.log('HabemusAuth listening at port %s', options.port);
});