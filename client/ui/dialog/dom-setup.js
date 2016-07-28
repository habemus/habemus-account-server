// internal dependencies
const errors = require('../../errors');

function _focusAndSelectAll(input) {
  input.focus();
  input.select();
}

exports.setupSelector = function (dialog) {
  /**
   * Toggling the action the modal shows
   */
  var actionSelector = dialog.element.querySelector('#h-auth-action-selector');
  actionSelector.addEventListener('click', function (e) {
    var target = e.target;

    var state = target.getAttribute('data-value');

    if (state) {
      dialog.model.set('state', state);
    }
  });

  /**
   * Auto focus
   */
  dialog.model.on('change:state', function () {
    var state = dialog.model.get('state');

    if (state === 'signup' || state === 'login') {

      var focusInput = dialog.element.querySelector(
        '[data-state~="' + state + '"] [autofocus]');

      // set the focus in a timeout, to prevent browser
      // default behaviors.
      // TODO: study this better, focus and autofocus is a bit hard
      // to reason about
      setTimeout(function () {
        _focusAndSelectAll(focusInput);
      }, 100);
    }
  })
};

exports.setupLoginForm = function (dialog) {
  /**
   * Login form submission
   */
  var loginForm  = dialog.element.querySelector('#h-auth-login');
  var loginUsername = loginForm.querySelector('[name="email"]');
  var loginPassword = loginForm.querySelector('[name="password"]');

  var loginErrorMessage = loginForm.querySelector('[data-state="login-error"]');

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    var email    = loginUsername.value;
    var password = loginPassword.value;

    // set the dialog to login-loading mode
    dialog.model.set('state', 'login-loading');

    dialog.auth
      .logIn(email, password)
      .then(function (user) {

        dialog.resolve(user);
        dialog.close();

      }, function (err) {

        dialog.model.set('state', 'login-error');

        if (err.name === 'InvalidCredentials') {
          loginErrorMessage.innerHTML = 'InvalidCredentials';

          _focusAndSelectAll(loginPassword);
        } else {
          loginErrorMessage.innerHTML = 'Unknown log in error';
        }
      });

  });
};

exports.setupSignupForm = function (dialog) {
  // elements
  var signupForm = dialog.element.querySelector('#h-auth-signup');
  var signupUsername = signupForm.querySelector('[name="email"]');
  var signupPassword = signupForm.querySelector('[name="password"]');
  var signupPasswordConfirm = signupForm.querySelector('[name="password-confirm"]');

  var signupSuccess = dialog.element.querySelector('#h-auth-signup [data-state="signup-success"]');
  var signupErrorMessage   = dialog.element.querySelector('#h-auth-signup [data-state="signup-error"]');

  var _user;

  signupForm.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    var email    = signupUsername.value;
    var password = signupPassword.value;
    var passwordConfirm = signupPasswordConfirm.value;

    if (password !== passwordConfirm) {
      dialog.model.set('state', 'signup-error');

      signupErrorMessage.innerHTML = 'Passwords do not match';

      _focusAndSelectAll(signupPasswordConfirm);
      return;
    }

    // set the dialog to signup-loading mode
    dialog.model.set('state', 'signup-loading');

    dialog.auth
      .signUp(email, password, email, {
        // signup and immediately logIn after signUp
        immediatelyLogIn: true,
      })
      .then(function (user) {

        dialog.model.set('state', 'signup-success');

        // resolve the promise
        dialog.resolve(user);

      }, function (err) {

        dialog.model.set('state', 'signup-error');

        if (err.name === 'UsernameTaken') {

          signupErrorMessage.innerHTML = 'UsernameTaken';

        } else {
          signupErrorMessage.innerHTML = 'Unknown sign up error';
        }
      });

  });
};

exports.closeButtons = function (dialog) {
  dialog.element.addEventListener('click', function (e) {
    var target = e.target;

    var action = target.getAttribute('data-action');

    switch (action) {
      case 'close':
        dialog.close();
        break;
      case 'cancel':
        dialog.reject(new errors.UserCancelled('Action cancelled by the user.'));
        dialog.close();
        break;
    }
  });
};
