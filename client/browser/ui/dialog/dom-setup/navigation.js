// own
const aux = require('../../../auxiliary');

module.exports = function (dialog, options) {
  /**
   * Toggling the action the modal shows
   */
  dialog.element.addEventListener('click', function (e) {
    var target = e.target;

    var state = target.getAttribute('data-navigate-to');

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
        aux.focusAndSelectAll(focusInput);
      }, 100);
    }
  })
};
