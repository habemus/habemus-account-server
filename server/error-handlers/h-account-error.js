// constants
const ERROR_PROPERTIES = {
  name: true,
  message: true
};

module.exports = function (app, options) {

  const errors = app.errors;

  app.use(function (err, req, res, next) {
    
    if (err instanceof errors.HAccountError) {

      switch (err.name) {
        case 'UsernameTaken':
        case 'EmailTaken':
          var msg = app.format.error(err, ERROR_PROPERTIES);
          res.status(400).json(msg);
          break;

        case 'InvalidCredentials':
          var msg = app.format.error({
            name: 'InvalidCredentials'
          }, ERROR_PROPERTIES);
          res.status(401).json(msg);
          break;

        case 'InvalidToken':
        case 'Unauthorized':
          var msg = app.format.error(err, ERROR_PROPERTIES);
          res.status(403).json(msg);
          break;

        case 'InvalidOption':
          var msg = app.format.error(err, {
            name: true,
            message: true,
            option: true,
            kind: true
          });
          res.status(400).json(msg);
          break;

        case 'UserNotFound':
          var msg = app.format.error(err, ERROR_PROPERTIES);
          res.status(404).json(msg);
          break;
          
        default:
          next(err);
          break;
      }

    } else {
      next(err);
    }
  });
};