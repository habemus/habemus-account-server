// internal dependencies
const errors = require('../../../../errors');

const setupNavigation = require('./navigation');
const setupLoginForm  = require('./login-form');
const setupSignupForm = require('./signup-form');
const closeButtons           = require('./close-buttons');
const setupEmailVerification = require('./email-verification');
const setupPasswordReset     = require('./password-reset');

var domSetup = function (dialog, options) {
  setupNavigation(dialog, options);
  setupLoginForm(dialog, options);
  setupSignupForm(dialog, options);
  closeButtons(dialog, options);
  setupEmailVerification(dialog, options);
  setupPasswordReset(dialog, options);
};

domSetup.setupNavigation = setupNavigation;
domSetup.setupLoginForm = setupLoginForm;
domSetup.setupSignupForm = setupSignupForm;
domSetup.closeButtons = closeButtons;
domSetup.setupEmailVerification = setupEmailVerification;
domSetup.setupPasswordReset = setupPasswordReset;

module.exports = domSetup;
