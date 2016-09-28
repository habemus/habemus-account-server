// internal dependencies
const errors = require('../../../../errors');

const setupNavigation = require('./navigation');
const setupLoginForm  = require('./login-form');
const setupSignupForm = require('./signup-form');
const closeButtons           = require('./close-buttons');
const setupEmailVerification = require('./email-verification');

var domSetup = function (dialog, options) {
  setupNavigation(dialog, options);
  setupLoginForm(dialog, options);
  setupSignupForm(dialog, options);
  closeButtons(dialog, options);
  setupEmailVerification(dialog, options);
};

domSetup.setupNavigation = setupNavigation;
domSetup.setupLoginForm = setupLoginForm;
domSetup.setupSignupForm = setupSignupForm;
domSetup.closeButtons = closeButtons;
domSetup.setupEmailVerification = setupEmailVerification;

module.exports = domSetup;
