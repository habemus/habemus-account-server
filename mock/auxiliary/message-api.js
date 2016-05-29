const pkg = require('../../package.json');
const jsonMessage = require('json-message');

module.exports = jsonMessage(pkg.version);