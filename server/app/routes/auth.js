// third-party
var bodyParser = require('body-parser');

module.exports = function (app, options) {

  app.post('/auth/token/generate',
    bodyParser.json(),
    function (req, res, next) {

      var username = req.body.username;
      var password = req.body.password;

      app.controllers.auth.generateToken(username, password)
        .then((token) => {

          res.status(201).jsonI({ token: token }, {
            token: true
          });
        })
        .catch((err) => {
          next(err);
        });
    }
  );

  app.post('/auth/token/decode',
    bodyParser.json(),
    function (req, res, next) {

      var token = req.body.token;

      app.controllers.auth.decodeToken(token)
        .then((decoded) => {

          res.jsonI(decoded, {
            username: true,
            createdAt: true,
            verifiedAt: true,
            iat: true,
            exp: true
          });
        })
        .catch((err) => {
          next(err);
        });
    }
  );

  app.post('/auth/token/revoke',
    app.middleware.authenticate,
    bodyParser.json(),
    function (req, res, next) {

      // revoke the token used to authenticate
      app.controllers.auth.revokeToken(req.user.jti)
        .then((revocation) => {
          res.jsonI(revocation, {
            tokenId: true
          });
        })
        .catch((err) => {
          next(err);
        });
    }
  );
};