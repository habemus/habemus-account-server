// own dependencies
const aux = require('./auxiliary');

module.exports = function (app, options) {

  options = options || {};

  /**
   * Function that retrieves the user's identifier
   * Defaults to getting the identifier from the requests's 
   * `params.identifier` property
   * 
   * @param  {Express Request} req
   * @return {String}
   */
  var _identifier = options.identifier || function (req) {
    return req.params.identifier;
  };

  /**
   * Function or value that represents which identifier property
   * the identifier parameter refers to.
   * There are three options: 
   *   - _id
   *   - username
   *   - email
   * 
   * @param  {express req} req
   * @return {String}
   */
  var _identifierProp = options.identifierProp || function (req) {

    var query = req.query;

    if (query.byId) {
      return '_id';
    } else if (query.byEmail) {
      return 'email';
    } else {
      // by default use username as identifier prop
      return 'username';
    }
  }

  /**
   * Name of the property to be set onto the req object
   * to store the resulting account.
   * @type {String}
   */
  var _as = options.as || 'account';

  return function (req, res, next) {

    var identifier     = aux.evalOpt(_identifier, req);
    var identifierProp = aux.evalOpt(_identifierProp, req);
    var as             = aux.evalOpt(_as, req);

    switch (identifierProp) {
      case '_id':

        app.controllers.account.getById(identifier)
          .then((account) => {
            req[as] = account;

            next();
          })
          .catch(next);

        break;
      case 'email':

        app.controllers.account.getByEmail(identifier)
          .then((account) => {
            req[as] = account;

            next();
          })
          .catch(next);

        break;
      case 'username':

        app.controllers.account.getByUsername(identifier)
          .then((account) => {
            req[as] = account;

            next();
          })
          .catch(next);

        break;
      default:
        next(new Error('unsupported identifierProp ' + identifierProp));
        break;
    }
  };
};