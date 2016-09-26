module.exports = function (app, options) {
  require('./user')(app, options);
  require('./auth')(app, options);
};
