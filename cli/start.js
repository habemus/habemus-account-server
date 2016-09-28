// native dependencies
const fs   = require('fs');
const path = require('path');
const http = require('http');

// internal dependencies
const pkg = require('../package.json');
const createHabemusAuth = require('../');

if (!process.env.MONGODB_URI_PATH) { throw new Error('MONGODB_URI_PATH is required'); }
const MONGODB_URI = fs.readFileSync(process.env.MONGODB_URI_PATH, 'utf8');

if (!process.env.SECRET_PATH) { throw new Error('SECRET_PATH is required'); }
const SECRET = fs.readFileSync(process.env.SECRET_PATH, 'utf8');

var options = {
  apiVersion: pkg.version,
  port: process.env.PORT,
  fromEmail: process.env.FROM_EMAIL,
  corsWhitelist: process.env.CORS_WHITELIST,

  mongodbURI: MONGODB_URI,
  rabbitMQURI: process.env.RABBIT_MQ_URI,
  secret: SECRET,
};

// instantiate the app
var app = createHabemusAuth(options);

// create http server and pass express app as callback
var server = http.createServer(app);

// start listening
server.listen(options.port, function () {
  console.log('HabemusAuth listening at port %s', options.port);
});