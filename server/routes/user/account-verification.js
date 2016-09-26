// third-party
const bodyParser = require('body-parser');

module.exports = function (app, options) {

  app.post('/user/:username/request-account-verification',
    bodyParser.json(),
    function (req, res, next) {

      app.controllers.accVerification.createRequest(req.params.username)
        .then(() => {
          res.status(201).send();
        })
        .catch(next);
    }
  );

  app.post('/user/:username/verify-account',
    bodyParser.json(),
    function (req, res, next) {

      app.controllers.accVerification.verifyUserAccount(
        req.params.username,
        req.body.code
      ).then(() => {

        res.status(200).send();
      })
      .catch(next);
    }
  );

  app.get('/user/:username/verify-account', function (req, res, next) {

    app.controllers.accVerification.verifyUserAccount(
      req.params.username,
      req.query.code
    ).then((user) => {

      res.status(200).send();
    })
    .catch(next);
  });
};