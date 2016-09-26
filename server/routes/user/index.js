// third-party
const bodyParser = require('body-parser');
const Bluebird   = require('bluebird');

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
        .catch(next);
    }
  );

  app.get('/user/:username',
    app.middleware.authenticate,
    function (req, res, next) {

      app.controllers.user.getByUsername(req.params.username)
        .then((user) => {
          // check that the authenticated user
          // is the one that the request refers to
          if (req.token.sub !== user._id) {
            next(new app.errors.Unauthorized());
            return;
          } else {

            var msg = app.format.item(user, USER_DATA);
            res.json(msg);
          }
        })
        .catch(next);
    }
  );

  app.delete('/user/:username',
    app.middleware.authenticate,
    function (req, res, next) {

      app.controllers.user.getByUsername(req.params.username)
        .then((user) => {
          // check that the authenticated user
          // is the one that the request refers to
          if (req.token.sub !== user._id) {
            return Bluebird.reject(new app.errors.Unauthorized());
          } else {
            return app.controllers.user.delete(req.params.username);
          }
        })
        .then((deletedUserData) => {
          res.status(204).send();
        })
        .catch(next);
    }
  );

  require('./account-verification')(app, options);
  require('./password-reset')(app, options);
};