// third-party
const bodyParser = require('body-parser');

// cosntants
const TRAILING_SLASH_RE = /\/$/;

module.exports = function (app, options) {

  /**
   * The host uri of the ui to be presented to the user upon
   * verification success or failure
   * @type {String}
   */
  const UI_HOST_URI = options.uiHostURI.replace(TRAILING_SLASH_RE, '');

  app.post('/account/:username/request-email-verification',
    bodyParser.json(),
    function (req, res, next) {

      app.controllers.emailVerification.createRequest(req.params.username)
        .then(() => {
          res.status(201).send();
        })
        .catch(next);
    }
  );

  app.post('/account/:username/verify-email',
    bodyParser.json(),
    function (req, res, next) {

      app.controllers.emailVerification.verifyAccountEmail(
        req.params.username,
        req.body.code
      ).then(() => {

        res.status(200).send();
      })
      .catch(next);
    }
  );

  app.get('/account/:username/verify-email', function (req, res, next) {

    var username = req.params.username;

    app.controllers.emailVerification.verifyAccountEmail(
      req.params.username,
      req.query.code
    ).then((account) => {

      // success redirect
      var redirectSuccessURL = [
        UI_HOST_URI,
        app.constants.UI_ACCOUNT_EMAIL_VERIFICATION_SUCCESS_PATH,
        '?username=' + username
      ].join('');

      res.redirect(303, redirectSuccessURL);
    })
    .catch((err) => {

      if (err.name === 'InvalidCredentials') {

        // error redirect
        var redirectErrorURL = [
          UI_HOST_URI,
          app.constants.UI_ACCOUNT_EMAIL_VERIFICATION_ERROR_PATH,
          '?username=' + username
        ].join('');

        res.redirect(303, redirectErrorURL);

      } else {
        next(err);
      }
    });
  });
};