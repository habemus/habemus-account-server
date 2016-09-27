// third-party
const bodyParser = require('body-parser');

module.exports = function (app, options) {

  app.post('/request-password-reset',
    bodyParser.json(),
    function (req, res, next) {

      var username = req.body.username;

      // find the user
      app.controllers.passwordReset.createRequest(username)
        .then(() => {
          res.status(204).send();
        })
        .catch(next);
    }
  );

  app.post('/reset-password',
    bodyParser.json(),
    function (req, res, next) {

      var username = req.body.username;
      var code     = req.body.code;
      var password = req.body.password;

      app.controllers.passwordReset
        .resetPassword(username, code, password)
        .then(() => {

          res.status(204).send();

        })
        .catch(next);
    }
  );
};