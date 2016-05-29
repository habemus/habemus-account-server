const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

module.exports = function (options, req, res) {

  var jwtPayload = {};
  var jwtOptions = {
    subject: mongoose.Types.ObjectId(),
  };

  var token = jwt.sign(jwtPayload, 'SECRET', jwtOptions);

  var msg = req.app.messageAPI.response.item();
  msg.load({ token: token }, { token: true });

  res.status(201).json(msg);
};