module.exports = function (app, options) {

  app.use(function (err, req, res, next) {
    if (err.name === 'HAuthError') {

      var msg = app.jsonM.response.item();

      switch (err.code) {
        case 'UsernameTaken':
          msg.err(err.code, err.message);
          res.status(400).json(msg);
          break;
        case 'UsernameNotFound':
        case 'InvalidCredentials':
          msg.err('InvalidCredentials', '');
          res.status(401).json(msg);
          break;
        case 'TokenMissing':
          msg.err(err.code, err.message);
          res.status(400).json(msg);
          break;
        case 'InvalidToken':
        case 'Unauthorized':
        case 'InvalidVerificationCode':
          msg.err(err.code, err.message);
          res.status(403).json(msg);
          break;
        case 'UsernameMissing':
        case 'EmailMissing':
        case 'PasswordMissing':
          msg.err(err.code, err.message);
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