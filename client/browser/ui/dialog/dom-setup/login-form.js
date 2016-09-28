const aux = require('../../../auxiliary');

module.exports = function (dialog, options) {
  /**
   * Login form submission
   */
  var loginForm  = dialog.element.querySelector('#h-account-login');
  var loginUsername = loginForm.querySelector('[name="username"]');
  var loginPassword = loginForm.querySelector('[name="password"]');

  var loginErrorMessage = loginForm.querySelector('[data-state="login-error"]');

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    var username = loginUsername.value;
    var password = loginPassword.value;

    // set the dialog to login-loading mode
    dialog.model.set('state', 'login-loading');

    dialog.hAccountClient
      .logIn(username, password)
      .then(function (user) {

        dialog.resolve(user);
        dialog.close();

      }, function (err) {

        dialog.model.set('state', 'login-error');

        if (err.name === 'InvalidCredentials') {
          loginErrorMessage.innerHTML = 'InvalidCredentials';

          aux.focusAndSelectAll(loginPassword);
        } else {
          loginErrorMessage.innerHTML = 'Unknown log in error';
        }
      });

  });
};
