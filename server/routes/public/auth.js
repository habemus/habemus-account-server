// third-party
const bodyParser = require('body-parser');

// constants
const interfaces = require('../interfaces');

module.exports = function (app, options) {

  app.post('/auth/token/generate',
    bodyParser.json(),
    function (req, res, next) {

      var username = req.body.username;
      var password = req.body.password;

      app.controllers.auth.generateToken(username, password)
        .then((token) => {
          
          var msg = app.services.messageAPI.item({ token: token }, { token: true });
          res.status(201).json(msg);
        })
        .catch(next);
    }
  );

  app.post('/auth/token/decode',
    bodyParser.json(),
    function (req, res, next) {

      var token = req.body.token;

      var _tokenData;

      app.controllers.auth.decodeToken(token)
        .then((decoded) => {

          _tokenData = decoded;

          return app.controllers.account.getById(decoded.sub);
        })
        .then((account) => {

          _tokenData.status = {
            value: account.status.value,
            updatedAt: account.status.updatedAt,
          };

          var msg = app.services.messageAPI.item(_tokenData, interfaces.TOKEN_DATA);
          res.json(msg);
        })
        .catch(next);
    }
  );

  app.post('/auth/token/revoke',
    app.middleware.authenticate(),
    bodyParser.json(),
    function (req, res, next) {
      // revoke the token used to authenticate
      app.controllers.auth.revokeToken(req.token.jti)
        .then((revocation) => {
          var msg = app.services.messageAPI.item(revocation, { tokenId: true });
          res.json(msg);
        })
        .catch(next);
    }
  );
};