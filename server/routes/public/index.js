module.exports = function (app, options) {
  require('./account')(app, options);
  require('./auth')(app, options);
};
