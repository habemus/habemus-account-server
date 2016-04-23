// third-party
var bodyParser = require('body-parser');

const USER_DATA = {
  username: true,
  createdAt: true,
};

module.exports = function (app, options) {
  
  app.post(
    '/users',
    bodyParser.json(),
    function (req, res, next) {

      app.controllers.user.create(req.body)
        .then((createdUser) => {
          res.status(201).jsonI(createdUser, USER_DATA);
        }, next);
    }
  );

  app.get('/user/:username',
    app.middleware.authenticate,
    function (req, res, next) {

      // check that the authenticated user
      // is the one that the request refers to
      if (req.user.username !== req.params.username) {
        next(new app.Error('Unauthorized'));
        return;
      }

      app.controllers.user.findOne({ username: req.params.username })
        .then((user) => {

          if (!user) {
            next(new app.Error('UsernameNotFound'));
            return;
          }

          res.jsonI(user, USER_DATA);
        })
        .catch(next);
    }
  );

  app.delete('/user/:username',
    app.middleware.authenticate,
    function (req, res, next) {

      // check that the authenticated user
      // is the one that the request refers to
      if (req.user.username !== req.params.username) {
        next(new app.Error('Unauthorized'));
        return;
      }

      app.controllers.user.delete(req.params.username)
        .then((deletedUserData) => {
          res.jsonI(deletedUserData, USER_DATA);
        })
        .catch(next);
    }
  );
};