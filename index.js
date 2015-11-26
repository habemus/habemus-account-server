// native dependencies
var http    = require('http');

// external dependencies
var express = require('express');
var morgan  = require('morgan');
var cors    = require('cors');

/**
 * Function that starts the host server
 */
function createHabemusAuth(options) {

  // create express app instance
  var app = express();

  // logging
  app.use(morgan('dev'));

  app.use(cors());

  // define description route
  app.get('/who', function (req, res) {
    res.json({
      name: 'habemus-auth'
    });
  });

  return app;
}

module.exports = createHabemusAuth;