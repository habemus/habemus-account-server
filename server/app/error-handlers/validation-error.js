// third-pary dependencies
const mongoose = require('mongoose');
const ValidationError = mongoose.Error.ValidationError;
const ValidatorError  = mongoose.Error.ValidatorError;

// constants
const ERROR_PROPERTIES = {
  code: true,
  message: true,
  path: true,
  kind: true,
  value: true,
}

module.exports = function (app, options) {

  app.use(function (err, req, res, next) {

    if (err.name === 'ValidationError') {

      var msg = app.format.error();

      for (var validatorErrName in err.errors) {

        var validatorErr = err.errors[validatorErrName];
        
        msg.load({
          code: 'ValidationError',
          message: validatorErr.message,
          path: validatorErr.path,
          kind: validatorErr.kind,
          value: validatorErr.value,
        }, ERROR_PROPERTIES);
      }

      res.status(400).json(msg);

    } else {
      next(err);
    }

  });

}