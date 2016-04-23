module.exports = function (app, options) {

  const BEARER_TOKEN_RE = /^Bearer\s+(.+)/;

  function parseToken(req) {
    var authorizationHeader = req.header('Authorization');

    if (!authorizationHeader) { return false; }

    var match = authorizationHeader.match(BEARER_TOKEN_RE);

    if (!match) {
      return false;
    } else {
      return match[1];
    } 
  }

  return function (req, res, next) {
    var token = parseToken(req);

    if (!token) {
      next(new app.Error('InvalidToken', token));
      return;
    }

    app.controllers.auth.decodeToken(token)
      .then(function (decoded) {
        // make the user data available to middleware after
        req.user = decoded;

        next();
      }, next);

  };
};