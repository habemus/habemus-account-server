// third-party
const bodyParser = require('body-parser');

const TOKEN_DATA = require('../../interfaces/token-data');

module.exports = function (app, options) {

  app.post('/auth/token/decode',
    bodyParser.json(),
    function (req, res, next) {

      var token = req.body.token;

      app.controllers.auth.decodeToken(token)
        .then((decoded) => {
          var msg = app.format.item(decoded, TOKEN_DATA);
          res.json(msg);
        })
        .catch(next);
    }
  );
};