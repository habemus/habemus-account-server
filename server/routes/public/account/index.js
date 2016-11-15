// third-party
const bodyParser = require('body-parser');
const Bluebird   = require('bluebird');

// constants
const interfaces = require('../../interfaces');

module.exports = function (app, options) {
  
  app.post('/accounts',
    bodyParser.json(),
    function (req, res, next) {

      app.controllers.account.create(req.body)
        .then((createdUser) => {

          var msg = app.services.messageAPI.item(createdUser, interfaces.ACCOUNT_DATA);

          res.status(201).json(msg);
        })
        .catch(next);
    }
  );

  app.get('/account/:username',
    app.middleware.authenticate(),
    app.middleware.loadAccount({
      identifierProp: 'username',
      identifier: function (req) {
        return req.params.username;
      },
    }),
    app.middleware.authorizeSelf(),
    function (req, res, next) {
      var msg = app.services.messageAPI.item(req.account, interfaces.ACCOUNT_DATA);
      res.json(msg);
    }
  );

  app.delete('/account/:username',
    app.middleware.authenticate(),
    app.middleware.loadAccount({
      identifierProp: 'username',
      identifier: function (req) {
        return req.params.username;
      },
    }),
    app.middleware.authorizeSelf(),
    function (req, res, next) {

      return app.controllers.account.delete(req.params.username)
        .then((deletedUserData) => {
          res.status(204).send();
        })
        .catch(next);
    }
  );
  
  require('./email-verification')(app, options);
  require('./password-reset')(app, options);
  require('./update')(app, options);
};
