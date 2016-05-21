module.exports = function (app, options) {

  app.use(function (err, req, res, next) {
    if (err.name === 'HAuthError') {

      switch (err.code) {
        case 'UsernameTaken':
          var msg = app.format.error(err.code, err.message);
          res.status(400).json(msg);
          break;
        case 'UsernameNotFound':
        case 'InvalidCredentials':
          var msg = app.format.error('InvalidCredentials', '', {});
          res.status(401).json(msg);
          break;
        case 'TokenMissing':
          var msg = app.format.error('TokenMissing', '', {});
          res.status(400).json(msg);
          break;
        case 'InvalidToken':
        case 'Unauthorized':
        case 'InvalidVerificationCode':
          var msg = app.format.error(err.code, '', {});
          res.status(403).json(msg);
          break;
        case 'UsernameMissing':
        case 'EmailMissing':
        case 'PasswordMissing':
          var msg = app.format.error(err.code, err.message, {});
          res.status(400).json(msg);
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