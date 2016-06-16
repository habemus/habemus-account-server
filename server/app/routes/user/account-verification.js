// third-party
const bodyParser = require('body-parser');

const USER_DATA = require('../../interfaces/user-data');
const TOKEN_DATA = require('../../interfaces/token-data');

for (prop in USER_DATA) {
  TOKEN_DATA[prop] = USER_DATA[prop];
}

module.exports = function (app, options) {

  app.post('/user/:userId/request-account-verification',
    bodyParser.json(),
    function (req, res, next) {

      app.controllers.accVerification.createRequest(req.params.userId)
        .then(() => {
          res.status(201).send();
        })
        .catch(next);
    }
  );

  app.post('/user/:userId/verify-account',
    bodyParser.json(),
    function (req, res, next) {

      app.controllers.accVerification.verifyUserAccount(
        req.params.userId,
        req.body.code
      ).then((user) => {

        res.status(200).send();
      })
      .catch(next);
    }
  );

  app.get('/user/:userId/verify-account', function (req, res, next) {

    app.controllers.accVerification.verifyUserAccount(
      req.params.userId,
      req.query.code
    ).then((user) => {

      res.status(200).send();
    })
    .catch(next);
  });
};