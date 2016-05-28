// constants
const ERROR_PROPERTIES = {
  code: true,
  message: true
};

module.exports = function (app, options) {

  app.use(function (err, req, res, next) {
    next(err);
  });
};