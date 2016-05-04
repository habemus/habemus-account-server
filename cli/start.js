// native dependencies
var path = require('path');
var http = require('http');

// internal dependencies
var pkg = require('../package.json');

// internal dependencies
var createHabemusAuth = require('../');

var options = {
  apiVersion: pkg.version,
  port: process.env.PORT,
  mongodbURI: process.env.MONGODB_URI,
  secret: process.env.SECRET,
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL,
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