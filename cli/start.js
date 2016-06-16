// native dependencies
const fs   = require('fs');
const path = require('path');
const http = require('http');

// third-party dependencies
const sgTransport = require('nodemailer-sendgrid-transport');

// internal dependencies
const pkg = require('../package.json');
const createHabemusAuth = require('../');

if (!process.env.SENDGRID_API_KEY_PATH) { throw new Error('SENDGRID_API_KEY_PATH is required'); }
const SENDGRID_API_KEY = fs.readFileSync(process.env.SENDGRID_API_KEY_PATH, 'utf8');

if (!process.env.MONGODB_URI_PATH) { throw new Error('MONGODB_URI_PATH is required'); }
const MONGODB_URI = fs.readFileSync(process.env.MONGODB_URI_PATH, 'utf8');

if (!process.env.SECRET_PATH) { throw new Error('SECRET_PATH is required'); }
const SECRET = fs.readFileSync(process.env.SECRET_PATH, 'utf8');

var options = {
  apiVersion: pkg.version,
  port: process.env.PORT,
  host: process.env.HOST,
  fromEmail: process.env.FROM_EMAIL,
  corsWhitelist: process.env.CORS_WHITELIST,

  // Secret stuff
  nodemailerTransport: sgTransport({
    auth: {
      api_key: SENDGRID_API_KEY
    }
  }),
  mongodbURI: MONGODB_URI,
  secret: SECRET,
};

options.host = process.env.HOST;

// instantiate the app
var app = createHabemusAuth(options);

// create http server and pass express app as callback
var server = http.createServer(app);

// start listening
server.listen(options.port, function () {
  console.log('HabemusAuth listening at port %s', options.port);
});