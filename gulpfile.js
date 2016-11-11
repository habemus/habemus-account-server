// third-party dependencies
const jwt         = require('jsonwebtoken');
const MongoClient = require('mongodb').MongoClient;
const gulp        = require('gulp');
const gulpNodemon = require('gulp-nodemon');

// tests
const istanbul    = require('gulp-istanbul');
const mocha       = require('gulp-mocha');

const DEV_DB_URI = 'mongodb://localhost:27017/h-auth-development-db';
const DEV_RABBIT_MQ_URI = 'amqp://192.168.99.100';
const TEST_SECRET = 'TEST_SECRET';

// SERVER //

/**
 * Run server and restart it everytime server file changes
 */
gulp.task('nodemon', function () {
  gulpNodemon({
    script: 'cli/dev-start.js',
    env: {
      PORT: '4000',
      MONGODB_URI: DEV_DB_URI,
      RABBIT_MQ_URI: DEV_RABBIT_MQ_URI,
      SECRET: TEST_SECRET,
      CORS_WHITELIST: 'http://localhost:3000',
      FROM_EMAIL: 'simon.fan@habem.us',
      PUBLIC_HOST_URI: 'http://local.dev.h-account:4000/public',
      UI_HOST_URI: 'http://local.dev.h-account:4000/public/ui',
    },
    ext: 'js',
    ignore: [
      'client/**/*',
      'dist/**/*',
      'gulpfile.js',
    ],
  })
});

gulp.task('token', function () {

  var payload = {};

  var token = jwt.sign(payload, TEST_SECRET);

  console.log(token);

});

gulp.task('pre-test', function () {
  return gulp.src(['server/**/*.js', 'shared/**/*.js'])
    // Covering files
    .pipe(istanbul())
    // Force `require` to return covered files
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function () {
  return gulp.src(['test/tests/**/*.js'])
    .pipe(mocha())
    // Creating the reports after tests ran
    .pipe(istanbul.writeReports())
    // Enforce a coverage of at least 90%
    .pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } }))
    .on('error', (err) => {
      this.emit('error', err);
    });
});

/**
 * Migration
 */
gulp.task('drop-db', function (done) {
  // connect
  var _db;

  MongoClient.connect(DEV_DB_URI)
    .then((db) => {
      _db = db;
      return db.dropDatabase();
    })
    .then(() => {
      return _db.close(true, done);
    })
    .catch(done);
});

gulp.task('migrate', function () {

});
