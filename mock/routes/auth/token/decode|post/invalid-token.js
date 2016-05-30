const mongoose = require('mongoose');

const TOKEN_DATA = require('../../../../../server/app/interfaces/token-data');

module.exports = function (options, req, res) {
  var errorData = {
    code: 'InvalidToken',
  };

  var msg = req.app.messageAPI.response.error();
  msg.load(errorData, { code: true });

  res.status(401).json(msg);
};