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
const hLock  = require('h-lock');

// own dependencies
const errors = require('../shared/errors');

/**
 * Function that starts the host server
 */
function createHabemusAuth(options) {
  if (!options.apiVersion) { throw new Error('apiVersion is required'); }  
  if (!options.mongodbURI) { throw new Error('mongodbURI is required'); }
  if (!options.secret) { throw new Error('secret is required'); }

  // host is used for the account verification email
  if (!options.host) { throw new Error('host is required'); }
  
  // nodemailer
  if (!options.nodemailerTransport) { throw new Error('nodemailerTransport is required'); }
  if (!options.fromEmail) { throw new Error('fromEmail is required'); }

  // create express app instance
  var app = express();

  // make the error constructors available throughout the application
  app.errors = errors;

  // logging
  require('./setup/logger')(app, options);

  // create a mongoose mongo db connection
  var conn = mongoose.createConnection(options.mongodbURI);

  // constants
  app.constants = require('../shared/constants');

  // services
  app.services = {};
  app.services.nodemailer = nodemailer.createTransport(options.nodemailerTransport);
  app.services.token = hToken({
    tokenModelName: 'HAuthToken',
    issuer: 'h-auth',
    mongooseConnection: conn,
    secret: options.secret,
    defaultTokenExpiry: '30d',
  });

  // locks
  app.services.accountLock = hLock({
    lockModelName: 'HAuthAccountLock',
    mongooseConnection: conn,
  });
  app.services._auxiliaryLock = hLock({
    lockModelName: 'HAuthAuxiliaryLock',
    mongooseConnection: conn,

    /**
     * Let the lock be discarded once it has been successfully unlocked
     * @type {Boolean}
     */
    discardAfterUnlock: true
  });
  
  // load models
  app.models = {};
  app.models.User = require('./models/user')(conn, app, options);
  app.models.ProtectedActionRequest = require('./models/protected-action-request')(conn, app, options);

  // instantiate controllers
  app.controllers = {};
  app.controllers.user = require('./controllers/user')(app, options);
  app.controllers.auth = require('./controllers/auth')(app, options);
  app.controllers.protectedRequest = require('./controllers/protected-request')(app, options);
  app.controllers.accVerification = require('./controllers/acc-verification')(app, options);
  app.controllers.pwdReset = require('./controllers/pwd-reset')(app, options);

  // instantiate middleware for usage in routes
  app.middleware = {};
  app.middleware.authenticate = require('./middleware/authenticate')(app, options);

  require('./setup/middleware')(app, options);

  // define description route
  app.get('/who', function (req, res) {
    var msg = app.format.item({ name: 'h-auth' }, { name: true });
    res.json(msg);
  });

  // load routes
  require('./routes/public')(app, options);
  require('./routes/private')(app, options);

  // load error-handlers
  require('./error-handlers/h-auth-error')(app, options);

  return app;
}

module.exports = createHabemusAuth;