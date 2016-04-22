module.exports = function (app, options) {

  app.use(function (err, req, res, next) {

    if (err.name === 'ValidationError') {
      res.status(400).json({});

    } else {
      next(err);
    }

  });

}