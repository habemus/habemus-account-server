// third-party
const envOptions = require('@habemus/env-options');

// internal dependencies
const createHAccount = require('../../');
const migration = require('../../migrations/2016-11-parse');

var options = envOptions({
  port:             'env:PORT',

  apiVersion:       'pkg:version',
  corsWhitelist:    'list:CORS_WHITELIST',
  fromEmail:        'env:FROM_EMAIL',

  mongodbURI:       'fs:MONGODB_URI_PATH',
  rabbitMQURI:      'fs:RABBIT_MQ_URI_PATH',

  publicHostURI:    'env:PUBLIC_HOST_URI',
  uiHostURI:        'env:UI_HOST_URI',

  authSecret:       'fs:AUTH_SECRET_PATH',

  enablePrivateAPI: 'bool?:ENABLE_PRIVATE_API',
  privateAPISecret: 'fs?:PRIVATE_API_SECRET_PATH',

  // 
  migrationUsersJSON: 'fs:MIGRATION_USERS_JSON',
});

// instantiate the app
var app = createHAccount(options);

migration.migrate(app, {
  users: JSON.parse(options.migrationUsersJSON),
});
