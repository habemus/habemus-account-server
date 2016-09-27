// third-party
const bodyParser = require('body-parser');

module.exports = function (app, options) {

  app.post('/user/:username/request-account-verification',
    bodyParser.json(),
    function (req, res, next) {

      app.controllers.emailVerification.createRequest(req.params.username)
        .then(() => {
          res.status(201).send();
        })
        .catch(next);
    }
  );

  app.post('/user/:username/verify-email',
    bodyParser.json(),
    function (req, res, next) {

      app.controllers.emailVerification.verifyUserAccount(
        req.params.username,
        req.body.code
      ).then(() => {

        res.status(200).send();
      })
      .catch(next);
    }
  );

  app.get('/user/:username/verify-email', function (req, res, next) {

    app.controllers.emailVerification.verifyUserAccount(
      req.params.username,
      req.query.code
    ).then((user) => {

      res.status(200).send();
    })
    .catch(next);
  });
};