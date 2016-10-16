// external dependencies
const express  = require('express');

// own dependencies
const errors = require('../shared/errors');
const setupServices = require('./services');

/**
 * Function that creates an express app
 */
function hAccount(options) {
  if (!options.apiVersion) { throw new Error('apiVersion is required'); }  
  if (!options.mongodbURI) { throw new Error('mongodbURI is required'); }
  if (!options.rabbitMQURI) { throw new Error('rabbitMQURI is required'); }
  if (!options.authSecret) { throw new Error('authSecret is required'); }

  // mailing
  if (!options.fromEmail) { throw new Error('fromEmail is required'); }
  if (!options.publicHostURI) { throw new Error('publicHostURI is required'); }
  if (!options.uiHostURI) { throw new Error('uiHostURI is required'); }

  // create express app instance
  var app = express();

  // make the error constructors available throughout the application
  app.errors = errors;

  // constants
  app.constants = require('../shared/constants');

  app.ready = setupServices(app, options).then(() => {

    // instantiate controllers
    app.controllers = {};
    app.controllers.account = require('./controllers/account')(app, options);
    app.controllers.auth = require('./controllers/auth')(app, options);
    app.controllers.protectedRequest = require('./controllers/protected-request')(app, options);
    app.controllers.emailVerification = require('./controllers/email-verification')(app, options);
    app.controllers.passwordReset = require('./controllers/password-reset')(app, options);

    // instantiate middleware for usage in routes
    app.middleware = {};
    app.middleware.cors = require('./middleware/cors').bind(null, app);
    app.middleware.authenticate = require('./middleware/authenticate').bind(null, app);
    app.middleware.authenticatePrivate = require('./middleware/authenticate-private').bind(null, app);

    // define description route
    app.get('/who', function (req, res) {
      var msg = app.services.messageAPI.item({ name: 'h-account' }, { name: true });
      res.json(msg);
    });

    // load routes
    require('./routes/public')(app, options);
    if (options.enablePrivateAPI) {
      if (!options.privateAPISecret) {
        throw new Error('privateAPISecret is required for enablePrivateAPI = true');
      }
      
      require('./routes/private')(app, options);
    }

    // load error-handlers
    require('./error-handlers/h-account-error')(app, options);
  });

  return app;
}

module.exports = hAccount;
