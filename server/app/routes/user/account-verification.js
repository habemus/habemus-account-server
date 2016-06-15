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

      var username = req.body.username;
    }
  );

  app.post('/user/:userId/verify-account',
    bodyParser.json(),
    function (req, res, next) {

      app.controllers.accVerification.verifyUserAccount(
        req.params.userId,
        req.body.code
      ).then((user) => {

        var msg = app.format.item(user, USER_DATA);

        res.json(msg);
      })
      .catch((err) => {
        next(err);
      });
    }
  );

  app.get('/user/:userId/verify-account', function (req, res, next) {

    app.controllers.accVerification.verifyUserAccount(
      req.params.userId,
      req.query.code
    ).then((user) => {
      var msg = app.format.item(user, USER_DATA);
      res.json(msg);
    })
    .catch((err) => {
      next(err);
    });
  });
};