const path = require('path');
const apiMock = require('express-api-mock');

const MOCK_ROUTES_ROOT = path.join(__dirname, 'routes');

module.exports = function (respondWith, options) {
  return apiMock(MOCK_ROUTES_ROOT, respondWith, options)
    .then(function (app) {

      app.messageAPI = require('./auxiliary/message-api');

      return app;
    });
};