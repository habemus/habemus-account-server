// native dependencies
const http = require('http');

// third-party
const envOptions = require('@habemus/env-options');

// internal dependencies
const createHabemusAuth = require('../');

var options = envOptions({
  apiVersion:    'pkg:version',
  corsWhitelist: 'list:CORS_WHITELIST',
  fromEmail:     'env:FROM_EMAIL',
  mongodbURI:    'fs:MONGODB_URI_PATH',
  port:          'env:PORT',
  publicHostURI: 'env:PUBLIC_HOST_URI',
  rabbitMQURI:   'fs:RABBIT_MQ_URI_PATH',
  secret:        'fs:SECRET_PATH',
  uiHostURI:     'env:UI_HOST_URI',
});

// instantiate the app
var app = createHabemusAuth(options);

// create http server and pass express app as callback
var server = http.createServer(app);

// start listening
server.listen(options.port, function () {
  console.log('HabemusAuth listening at port %s', options.port);
});
