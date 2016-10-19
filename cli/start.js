// native dependencies
const http = require('http');

// third-party
const envOptions = require('@habemus/env-options');

// internal dependencies
const createHabemusAuth = require('../');

var options = envOptions({
  port:             'env:PORT',

  apiVersion:       'pkg:version',
  corsWhitelist:    'list:CORS_WHITELIST',
  fromEmail:        'env:FROM_EMAIL',

  mongodbURI:       'fs:MONGODB_URI_PATH',
  rabbitMQURI:      'fs:RABBIT_MQ_URI_PATH',

  publicHostURI:    'env:PUBLIC_HOST_URI',
  uiHostURI:        'env:UI_HOST_URI',

  authSecret:       'fs:AUTH_SECRET_PATH',

  enablePrivateAPI: 'bool?:ENABLE_PRIVATE_API',
  privateAPISecret: 'fs?:PRIVATE_API_SECRET_PATH',
});

// instantiate the app
var app = createHabemusAuth(options);

app.ready.then(() => {
  console.log('h-account ready');
})
.catch((err) => {
  console.warn('h-account setup error', err);
  process.exit(1);
});

// create http server and pass express app as callback
var server = http.createServer(app);

// start listening
server.listen(options.port, function () {
  console.log('h-account listening at port %s', options.port);
});
