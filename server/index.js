// native dependencies
var http    = require('http');

// external dependencies
var express  = require('express');
var morgan   = require('morgan');
var cors     = require('cors');
var mongoose = require('mongoose');
var jsonMessage = require('json-message');

// own dependencies
var HAuthError = require('./app/errors/h-auth-error');

/**
 * Function that starts the host server
 */
function createHabemusAuth(options) {
  if (!options.apiVersion) { throw new Error('apiVersion is required'); }  
  if (!options.mongodbURI) { throw new Error('mongodbURI is required'); }
  if (!options.secret) { throw new Error('secret is required'); }
  // if (!options.host) { throw new Error('host is required'); }

  // sendgrid
  if (!options.sendgridApiKey) { throw new Error('sendgridApiKey is required'); }
  if (!options.sendgridFromEmail) { throw new Error('sendgridFromEmail is required'); }

  // create express app instance
  var app = express();

  // make the error constructor available throughout the application
  app.Error = HAuthError;


  // logging
  require('./app/setup/logger')(app, options);

  // create a mongoose mongo db connection
  var conn = mongoose.createConnection(options.mongodbURI);

  // services
  app.services = {};
  app.services.sendgrid = require('sendgrid')(options.sendgridApiKey);

  // load models
  app.models = {};
  app.models.User = require('./app/models/user')(conn, options);
  app.models.TokenRevocationEntry = require('./app/models/token-revocation-entry')(conn, options);

  // instantiate controllers
  app.controllers = {};
  app.controllers.user = require('./app/controllers/user')(app, options);
  app.controllers.auth = require('./app/controllers/auth')(app, options);

  // instantiate middleware for usage in routes
  app.middleware = {};
  app.middleware.authenticate = require('./app/middleware/authenticate')(app, options);

  require('./app/setup/middleware')(app, options);

  // define description route
  app.get('/who', function (req, res) {
    var msg = app.format.item({ name: 'h-auth' }, { name: true });
    res.json(msg);
  });

  // load routes
  require('./app/routes/user')(app, options);
  require('./app/routes/auth')(app, options);

  // load error-handlers
  require('./app/error-handlers/validation-error')(app, options);
  require('./app/error-handlers/h-auth-error')(app, options);

  return app;
}

module.exports = createHabemusAuth;