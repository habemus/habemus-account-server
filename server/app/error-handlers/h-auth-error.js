// constants
const ERROR_PROPERTIES = {
  code: true,
  message: true
};

module.exports = function (app, options) {

  app.use(function (err, req, res, next) {
    
    if (err.name === 'HAuthError') {

      switch (err.code) {
        case 'UsernameTaken':
          var msg = app.format.error(err, ERROR_PROPERTIES);
          res.status(400).json(msg);
          break;
        case 'UsernameNotFound':
        case 'InvalidCredentials':
        case 'InvalidVerificationCode':
          var msg = app.format.error({
            code: 'InvalidCredentials'
          }, ERROR_PROPERTIES);
          res.status(401).json(msg);
          break;
        case 'TokenMissing':
          var msg = app.format.error({
            code: 'TokenMissing'
          }, ERROR_PROPERTIES);
          res.status(400).json(msg);
          break;
        case 'InvalidToken':
        case 'Unauthorized':
          var msg = app.format.error(err, ERROR_PROPERTIES);
          res.status(403).json(msg);
          break;
        case 'UsernameMissing':
        case 'EmailMissing':
        case 'PasswordMissing':
          var msg = app.format.error(err, ERROR_PROPERTIES);
          res.status(400).json(msg);
          break;
        case 'AccountVerificationEmailNotSent':
          var msg = app.format.error({ code: 'InternalServerError' }, ERROR_PROPERTIES);
          res.status(500).json(msg);
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