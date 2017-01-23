// native dependencies
const http = require('http');

// internal dependencies
const pkg = require('../package.json');
const createHAccount = require('../');

var options = {
  apiVersion: pkg.version,
  port: process.env.PORT,
  mongodbURI: process.env.MONGODB_URI,
  rabbitMQURI: process.env.RABBIT_MQ_URI,
  authSecret: process.env.AUTH_SECRET,

  fromEmail: process.env.FROM_EMAIL,
  publicHostURI: process.env.PUBLIC_HOST_URI,
  uiHostURI: process.env.UI_HOST_URI,

  corsWhitelist: process.env.CORS_WHITELIST,
};

// instantiate the app
var app = createHAccount(options);

// create http server and pass express app as callback
var server = http.createServer(app);

console.log('waiting for h-account to become ready');

app.ready.then(() => {
  console.log('h-account ready');

  // start listening
  server.listen(options.port, function () {
    console.log('h-account listening at port %s', options.port);
  });

})
.catch((err) => {
  console.warn('h-account setup error', err);
  process.exit(1);
});