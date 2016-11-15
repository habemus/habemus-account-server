// third-party
const bodyParser = require('body-parser');
const Bluebird   = require('bluebird');

// constants
const interfaces = require('../../interfaces');

module.exports = function (app, options) {

  /**
   * Update an account's owner data
   */
  app.put('/account/:username/owner',
    app.middleware.authenticate(),
    app.middleware.loadAccount({
      identifierProp: 'username',
      identifier: function (req) {
        return req.params.username;
      },
    }),
    app.middleware.authorizeSelf(),
    bodyParser.json(),
    function (req, res, next) {

      var account = req.account;

      account.setOwnerData(req.body);

      return account.save()
        .then((account) => {

          var msg = app.services.messageAPI.item(account, interfaces.ACCOUNT_DATA);

          res.json(msg);
        })
        .catch(next);
    }
  );

  /**
   * Update application configurations
   */
  app.put('/account/:username/config/:applicationId',
    app.middleware.authenticate(),
    app.middleware.loadAccount({
      identifierProp: 'username',
      identifier: function (req) {
        return req.params.username;
      },
    }),
    app.middleware.authorizeSelf(),
    bodyParser.json(),
    function (req, res, next) {

      var account       = req.account;
      var applicationId = req.params.applicationId;
      var config        = req.body;

      if (app.constants.VALID_APPLICATION_IDS.indexOf(applicationId) === -1) {
        next(new app.errors.InvalidOption('applicationId', 'invalid'));
        return;
      }

      account.setApplicationConfig(applicationId, config);

      return account.save()
        .then((account) => {

          var msg = app.services.messageAPI.item(account, interfaces.ACCOUNT_DATA);

          res.json(msg);
        })
        .catch(next);
    }
  );

  /**
   * Update account preferences
   */
  app.put('/account/:username/preferences',
    app.middleware.authenticate(),
    app.middleware.loadAccount({
      identifierProp: 'username',
      identifier: function (req) {
        return req.params.username;
      },
    }),
    app.middleware.authorizeSelf(),
    bodyParser.json(),
    function (req, res, next) {

      var account     = req.account;
      var preferences = req.body;

      account.setPreferences(preferences);

      return account.save()
        .then((account) => {

          var msg = app.services.messageAPI.item(account, interfaces.ACCOUNT_DATA);

          res.json(msg);
        })
        .catch(next);
    }
  );
  
};
