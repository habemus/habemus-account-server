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

  // create express app instance
  var app = express();

  // make the error constructor available throughout the application
  app.Error = HAuthError;

  // make the response builder available throughout the application
  var jsonM = app.jsonM = jsonMessage(options.apiVersion);

  // logging
  app.use(morgan('dev'));

  app.use(cors());

  // create a mongoose mongo db connection
  var conn = mongoose.createConnection(options.mongodbURI);
  
  app.set('json spaces', 2);

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

  // global middleware
  // IN STUDY:
  app.use(function (req, res, next) {

    // define response methods
    res.jsonI = function (sourceData, projection) {
      var msg = jsonM.response.item();

      msg.load(sourceData, projection);

      res.json(msg);
    };

    // res.jsonL = function (sourceData, projection) {
    //   var msg = jsonM.response.list();

    //   msg.loag(sourceData, projection);
    //   res.json(msg);
    // };

    next();

  });

  // define description route
  app.get('/who', function (req, res) {
    res.jsonI({
      name: 'h-auth'
    }, {
      name: true
    });
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