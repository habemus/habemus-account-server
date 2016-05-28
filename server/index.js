// native dependencies
const http    = require('http');

// external dependencies
const express  = require('express');
const morgan   = require('morgan');
const cors     = require('cors');
const mongoose = require('mongoose');
const jsonMessage = require('json-message');
const nodemailer  = require('nodemailer');

// h-dependencies
const hToken = require('h-token');

// own dependencies
const HAuthError = require('../shared/errors');

/**
 * Function that starts the host server
 */
function createHabemusAuth(options) {
  if (!options.apiVersion) { throw new Error('apiVersion is required'); }  
  if (!options.mongodbURI) { throw new Error('mongodbURI is required'); }
  if (!options.secret) { throw new Error('secret is required'); }

  // host is used for the account verification email
  if (!options.host) { throw new Error('host is required'); }
  // 
  
  // nodemailer
  if (!options.nodemailerTransport) { throw new Error('nodemailerTransport is required'); }

  // sendgrid
  // if (!options.sendgridApiKey) { throw new Error('sendgridApiKey is required'); }
  // if (!options.sendgridFromEmail) { throw new Error('sendgridFromEmail is required'); }

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
  app.services.nodemailer = nodemailer.createTransport(options.nodemailerTransport);
  app.services.token = hToken({
    tokenModelName: 'HAuthToken',
    issuer: 'h-auth',
    mongooseConnection: conn,
    secret: options.secret
  });

  // load models
  app.models = {};
  app.models.User = require('./app/models/user')(conn, options);

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