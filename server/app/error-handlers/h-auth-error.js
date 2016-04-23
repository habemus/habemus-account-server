module.exports = function (app, options) {

  app.use(function (err, req, res, next) {
    if (err.name === 'HAuthError') {

      switch (err.code) {
        case 'UsernameTaken':
          res.status(400).json({});
          break;
        case 'UsernameNotFound':
        case 'InvalidCredentials':
          res.status(401).json({});
          break;
        case 'InvalidToken':
        case 'Unauthorized':
          res.status(403).json({});
          break;
        case 'PasswordMissing':
          res.status(400).json({});
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