// third-party
const ValidationError = require('mongoose').Error.ValidationError;

module.exports = function (app, options) {

  const errors = app.errors;

  app.use(function (err, req, res, next) {
    
    if (err instanceof ValidationError) {

      var keys = Object.keys(err.errors);

      var msg = app.services.messageAPI.error({
        name: 'InvalidOption',
        message: err.message,
        option: keys[0],
        kind: 'invalid',
      }, {
        name: true,
        message: true,
        option: true,
        kind: true
      });
      res.status(400).json(msg);

    } else {
      next(err);
    }
  });
};