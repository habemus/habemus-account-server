module.exports = function (dialog, options) {
  // elements
  var refresh = dialog.element.querySelector('#verification-refresh');
  var resend  = dialog.element.querySelector('#verification-resend');

  var hAccountClient = dialog.hAccountClient;

  /**
   * Fetches data about the account on the server
   * and checks if the verification status has modified
   */
  function refreshVerificationStatus() {
    var authToken = hAccountClient.getAuthToken();

    if (authToken) {
      hAccountClient.getCurrentUser()
        .then(function (user) {
          return hAccountClient.getAccount(authToken, user.username);
        })
        .then(function (account) {
          if (account.status.value === 'verified') {
            // success!
            dialog.resolve(account);
            dialog.close();
          } else {
            // not
          }
        });
    }
  }

  refresh.addEventListener('click', refreshVerificationStatus);

  resend.addEventListener('click', function (e) {

    var authToken = hAccountClient.getAuthToken();

    hAccountClient.getCurrentUser()
      .then(function (user) {
        return hAccountClient.requestEmailVerification(authToken, user.username)
      })
      .then(function () {
        console.log('verification email resent');
      })
      .catch(function (err) {
        console.warn('there was an error resending the verification email', err);
      });

  });
};