module.exports = function (app, options) {

  const User = app.models.User;

  var userCtrl = {};

  userCtrl.create = function (userData) {

    // this specific validation must be run manually,
    // as the password is not defined at the User Model
    if (!userData.password) {
      var err = new app.Error('PasswordMissing');
      return Promise.reject(err);
    }

    return User.encryptPassword(userData.password)
      .then(function (hash) {
        userData.hash = hash;

        var user = new User(userData);

        return user.save();
      })
      .then(function (user) {
        return user;
      }, function (err) {

        if (err.name === 'MongoError' && err.code === 11000) {
          // TODO: improvement research:
          // for now we infer that any 11000 error (duplicate key)
          // refers to username repetition
          
          // redefine the error object
          err = new app.Error('UsernameTaken', userData.username);

        }

        if (err.name === 'ValidationError') {
          // throw err;
        }

        // always throw the error
        throw err;
      });
  };

  userCtrl.delete = function (username) {
    return User.findOneAndRemove({ username: username });
  };

  userCtrl.findOne = function (query) {
    return User.findOne(query);
  };

  // userCtrl.find = function (query) {
  //   return User.find(query);
  // };

  return userCtrl;
};