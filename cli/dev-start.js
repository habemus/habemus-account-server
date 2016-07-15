// native dependencies
const path = require('path');
const http = require('http');

// third-party dependencies
const sgTransport = require('nodemailer-sendgrid-transport');

// internal dependencies
const pkg = require('../package.json');
const createHabemusAuth = require('../');

if (!process.env.SENDGRID_API_KEY) { throw new Error('SENDGRID_API_KEY is required'); }

var options = {
  apiVersion: pkg.version,
  port: process.env.PORT,
  mongodbURI: process.env.MONGODB_URI,
  secret: process.env.SECRET,
  host: process.env.HOST,

  nodemailerTransport: sgTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY
    }
  }),
  fromEmail: process.env.FROM_EMAIL,
  corsWhitelist: process.env.CORS_WHITELIST,
};

options.host = process.env.HOST || 'localhost:' + options.port;

// instantiate the app
var app = createHabemusAuth(options);

// create http server and pass express app as callback
var server = http.createServer(app);

// start listening
server.listen(options.port, function () {
  console.log('HabemusAuth listening at port %s', options.port);
});