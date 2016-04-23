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

          var msg = app.jsonM.response.item();

          msg.load(createdUser, USER_DATA);

          res.status(201).json(msg);
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

          var msg = app.jsonM.response.item();

          if (user) {
            msg.load(user, USER_DATA);

            res.json(msg);
          } else {

            msg.err('User not found');

            res.status(404).json(msg);
          }
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
          var msg = app.jsonM.response.item();

          msg.load(deletedUserData, USER_DATA);

          res.json(msg);

        })
        .catch(next);
    }
  );
};