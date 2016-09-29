module.exports = function (dialog, options) {
  // elements
  var resetForm  = dialog.element.querySelector('#h-account-password-reset');
  var resetEmail = resetForm.querySelector('[name="email"]');

  var hAccountClient = dialog.hAccountClient;

  resetForm.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    var email = resetEmail.value;

    hAccountClient.requestPasswordReset(email)
      .then(function () {
        alert('password reset request created with success. an email was sent');
      });

    console.log('resetForm submit')

  });
};