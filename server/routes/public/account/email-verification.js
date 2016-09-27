// third-party
const bodyParser = require('body-parser');

module.exports = function (app, options) {

  app.post('/account/:username/request-email-verification',
    bodyParser.json(),
    function (req, res, next) {

      app.controllers.emailVerification.createRequest(req.params.username)
        .then(() => {
          res.status(201).send();
        })
        .catch(next);
    }
  );

  app.post('/account/:username/verify-email',
    bodyParser.json(),
    function (req, res, next) {

      app.controllers.emailVerification.verifyAccountEmail(
        req.params.username,
        req.body.code
      ).then(() => {

        res.status(200).send();
      })
      .catch(next);
    }
  );

  app.get('/account/:username/verify-email', function (req, res, next) {

    app.controllers.emailVerification.verifyAccountEmail(
      req.params.username,
      req.query.code
    ).then((user) => {

      res.status(200).send();
    })
    .catch(next);
  });
};