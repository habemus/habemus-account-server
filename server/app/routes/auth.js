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

          res.jsonI({ token: token }, {
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
          });
        })
        .catch((err) => {
          next(err);
        });
    }
  );
};