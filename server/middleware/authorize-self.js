module.exports = function (app, options) {

  options = options || {};

  return function (req, res, next) {

    if (req.account._id !== req.token.sub) {
      next(new app.errors.Unauthorized());
      return;
    }

    next();
  };
};