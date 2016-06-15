// third-party
var bodyParser = require('body-parser');

const USER_DATA = require('../../interfaces/user-data');

module.exports = function (app, options) {
  
  app.post('/users',
    bodyParser.json(),
    function (req, res, next) {

      app.controllers.user.create(req.body)
        .then((createdUser) => {

          var msg = app.format.item(createdUser, USER_DATA);

          res.status(201).json(msg);
        })
        .catch((err) => {
          next(err);
        });
    }
  );

  app.get('/user/:userId',
    app.middleware.authenticate,
    function (req, res, next) {

      // check that the authenticated user
      // is the one that the request refers to
      if (req.token.sub !== req.params.userId) {
        next(new app.Error('Unauthorized'));
        return;
      }

      app.controllers.user.getById(req.params.userId)
        .then((user) => {

          if (!user) {
            next(new app.Error('UsernameNotFound'));
            return;
          }

          var msg = app.format.item(user, USER_DATA);
          res.json(msg);
        })
        .catch(next);
    }
  );

  app.delete('/user/:userId',
    app.middleware.authenticate,
    function (req, res, next) {

      // check that the authenticated user
      // is the one that the request refers to
      if (req.token.sub !== req.params.userId) {
        next(new app.Error('Unauthorized'));
        return;
      }

      app.controllers.user.delete(req.params.userId)
        .then((deletedUserData) => {
          var msg = app.format.item(deletedUserData, USER_DATA);
          res.json(msg);
        })
        .catch(next);
    }
  );

  require('./account-verification')(app, options);
  require('./password-reset')(app, options);
};