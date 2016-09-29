// internal dependencies
const errors = require('../../../../errors');

module.exports = function (dialog, options) {
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
