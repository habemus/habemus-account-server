// third-party
const bodyParser = require('body-parser');

const TOKEN_DATA = require('../../interfaces/token-data');

module.exports = function (app, options) {

  app.post('/auth/token/decode',
    bodyParser.json(),
    function (req, res, next) {

      var token = req.body.token;

      var _tokenData;

      app.controllers.auth.decodeToken(token)
        .then((decoded) => {

          _tokenData = decoded;

          // retrieve the account so that we can get its status
          return app.controllers.account.getById(decoded.sub);
        })
        .then((account) => {

          // set status onto the tokenData
          _tokenData.status = {
            value: account.status.value,
            updatedAt: account.status.updatedAt,
          };

          var msg = app.format.item(_tokenData, TOKEN_DATA);
          res.json(msg);
        })
        .catch(next);
    }
  );
};