'use strict';

// external dependencies
var request = require('superagent');

function Client() {

}

Client.prototype.who = function (cb) {
  request
    .get('http://localhost:4000/who')
    .end(cb);
}

module.exports = Client;