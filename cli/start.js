// native dependencies
var path = require('path');
var http = require('http');

// external dependencies
var commander = require('commander');
var _         = require('lodash');

// internal dependencies
var pkg = require('../package.json');

// internal dependencies
var createHabemusAuth = require('../');

commander
  .version(pkg.version)
  .option('-p, --port [port]', 'The port')
  .option('-d, --dir  [dir]', 'Path to the directory in which files are stored.')
  .parse(process.argv);

var DEFAULT_OPTIONS = {
  port: process.env.PORT || 8000,
};

var options = _.defaults(commander, DEFAULT_OPTIONS);

// instantiate the app
var app = createHabemusAuth(options);

// create http server and pass express app as callback
var server = http.createServer(app);

// start listening
server.listen(options.port, function () {
  console.log('HabemusAuth listening at port %s', options.port);
});