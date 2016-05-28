// third-party
const bodyParser = require('body-parser');

const USER_DATA = require('../interfaces/user-data');

var TOKEN_DATA = {
  sub: true,
  iat: true,
  exp: true,
};

for (prop in USER_DATA) {
  TOKEN_DATA[prop] = USER_DATA[prop];
}

module.exports = function (app, options) {

  app.post('/auth/token/generate',
    bodyParser.json(),
    function (req, res, next) {

      var username = req.body.username;
      var password = req.body.password;

      app.controllers.auth.generateToken(username, password)
        .then((token) => {
          
          var msg = app.format.item({ token: token }, { token: true });
          res.status(201).json(msg);
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
          var msg = app.format.item(decoded, TOKEN_DATA);
          res.json(msg);
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
      app.controllers.auth.revokeToken(req.token.jti)
        .then((revocation) => {
          var msg = app.format.item(revocation, { tokenId: true });
          res.json(msg);
        })
        .catch((err) => {
          next(err);
        });
    }
  );
};