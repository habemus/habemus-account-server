// own
const aux = require('../../../auxiliary');

module.exports = function (dialog, options) {
  // elements
  var signupForm = dialog.element.querySelector('#h-account-signup');
  var signupUsername = signupForm.querySelector('[name="username"]');
  var signupEmail    = signupForm.querySelector('[name="email"]');
  var signupPassword = signupForm.querySelector('[name="password"]');
  var signupPasswordConfirm = signupForm.querySelector('[name="password-confirm"]');

  var signupSuccess = dialog.element.querySelector('#h-account-signup [data-state="signup-success"]');
  var signupErrorMessage   = dialog.element.querySelector('#h-account-signup [data-state="signup-error"]');

  var _user;

  signupForm.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    var username = signupUsername.value;
    var email    = signupEmail.value;
    var password = signupPassword.value;
    var passwordConfirm = signupPasswordConfirm.value;

    if (password !== passwordConfirm) {
      dialog.model.set('state', 'signup-error');
      
      signupErrorMessage.innerHTML = 'Passwords do not match';

      aux.focusAndSelectAll(signupPasswordConfirm);
      return;
    }

    // set the dialog to signup-loading mode
    dialog.model.set('state', 'signup-loading');

    dialog.hAccountClient
      .signUp(username, password, email, {
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

        } else if (err.name) {
          
          signupErrorMessage.innerHTML = 'EmailTaken';

        } else {
          signupErrorMessage.innerHTML = 'Unknown sign up error';
        }
      });

  });
};
