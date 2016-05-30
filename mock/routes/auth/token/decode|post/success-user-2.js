const mongoose = require('mongoose');

const TOKEN_DATA = require('../../../../../server/app/interfaces/token-data');

module.exports = function (options, req, res) {
  var decoded = {
    sub: '507f191e810c19729de860ea',
    iat: Date.now() - (1000 * 60 * 60 * 24),
    exp: Date.now() + (1000 * 60 * 60 * 24),
  };

  var msg = req.app.messageAPI.response.item();
  msg.load(decoded, TOKEN_DATA);

  res.status(200).json(msg);
};