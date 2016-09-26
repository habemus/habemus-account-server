const http = require('http');

const hAuthMock = require('./index');

hAuthMock()
  .then(function (app) {
    var server = http.createServer(app);

    server.listen(5000, function () {
      console.log('h-auth mock server listening at localhost:5000');
    });
  });