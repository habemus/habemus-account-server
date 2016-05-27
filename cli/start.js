// native dependencies
const path = require('path');
const http = require('http');

// third-party dependencies
const sgTransport = require('nodemailer-sendgrid-transport');

// internal dependencies
const pkg = require('../package.json');
const createHabemusAuth = require('../');

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
  senderEmail: process.env.SENDER_EMAIL,
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