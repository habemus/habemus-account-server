// native dependencies
const path = require('path');

// third-party dependencies
const apiMock = require('express-api-mock');
const jsonMessage = require('json-message');

// constants
const MOCK_ROUTES_ROOT = path.join(__dirname, 'routes');
const pkg = require('../package.json');

module.exports = function (options, respondents) {
  return apiMock(MOCK_ROUTES_ROOT, options, respondents)
    .then(function (app) {

      app.messageAPI = jsonMessage(pkg.version);

      return app;
    });
};
