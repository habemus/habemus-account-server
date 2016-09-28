// native
const path = require('path');

// third-party
const express = require('express');

module.exports = function (app, options) {

  app.use('/ui', express.static(path.join(__dirname, 'static'), {
    extensions: ['html'],
  }));

};
