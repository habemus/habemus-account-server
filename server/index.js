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
  
  // nodemailer
  if (!options.nodemailerTransport) { throw new Error('nodemailerTransport is required'); }
  if (!options.fromEmail) { throw new Error('fromEmail is required'); }

  // create express app instance
  var app = express();

  // make the error constructor available throughout the application
  app.Error = HAuthError;


  // logging
  require('./app/setup/logger')(app, options);

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
  app.services.verificationCodeLock = hLock({
    lockModelName: 'HAuthAccountVerificationLock',
    mongooseConnection: conn,
    
    // locks are destroyed after successful usage
    useOnce: true
  });

  // load models
  app.models = {};
  app.models.User = require('./app/models/user')(conn, app, options);
  app.models.ProtectedActionRequest = require('./app/models/protected-action-request')(conn, app, options);

  // instantiate controllers
  app.controllers = {};
  app.controllers.user = require('./app/controllers/user')(app, options);
  app.controllers.auth = require('./app/controllers/auth')(app, options);
  app.controllers.protectedRequest = require('./app/controllers/protected-request')(app, options);
  app.controllers.accVerification = require('./app/controllers/acc-verification')(app, options);
  app.controllers.pwdReset = require('./app/controllers/pwd-reset')(app, options);

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
  require('./app/error-handlers/internal')(app, options);

  return app;
}

module.exports = createHabemusAuth;