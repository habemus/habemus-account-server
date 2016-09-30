module.exports = function (dialog, options) {
  // elements
  var resetForm  = dialog.element.querySelector('#h-account-password-reset');
  var resetEmail = resetForm.querySelector('[name="email"]');

  var hAccountClient = dialog.hAccountClient;

  resetForm.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    var email = resetEmail.value;

    // set the dialog to password-reset-loading mode
    dialog.model.set('state', 'password-reset-loading');

    hAccountClient.requestPasswordReset(email)
      .then(function () {
        dialog.model.set('state', 'password-reset-sent');
      })
      .catch(function () {
        dialog.model.set('state', 'password-reset-error');
      });
  });
};