module.exports = function (app, options) {
  require('./auth')(app, options);
};
