// third-party dependencies
const MongoClient = require('mongodb').MongoClient;
const gulp        = require('gulp');
const runSequence = require('run-sequence');
const gulpNodemon = require('gulp-nodemon');

// tests
const istanbul    = require('gulp-istanbul');
const mocha       = require('gulp-mocha');

// browserSync
const browserSync = require('browser-sync').create();

const DEV_DB_URI = 'mongodb://localhost:27017/h-auth-development-db';

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
      SECRET: 'TEST_SECRET',
      CORS_WHITELIST: 'http://localhost:3000',
      FROM_EMAIL: 'simon.fan@habem.us',
    },
    ext: 'js',
    ignore: [
      'client/**/*',
      'dist/**/*',
      'gulpfile.js',
    ],
  })
});

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

// MOCK SERVER
gulp.task('mock', function () {
  gulpNodemon({
    script: 'mock/cli.js',
    ext: 'js',
    ignore: [
      'client/**/*',
      'dist/**/*',
      'gulpfile.js',
    ],
  });
});

// CLIENT //
require('./tasks/client/build')(gulp);
// Static server
gulp.task('serve:client', function() {
  browserSync.init({
    server: {
      baseDir: ['./demo', './dist', './client']
    },
    open: true
  });
});

/**
 * Watch for changes and auto recompile
 */
gulp.task('watch', function () {

  var clientFiles = [
    'client/**/*.js',
    'client/**/*.html',
    'client/**/*.css',
  ];

  gulp.watch(clientFiles, ['javascript']);
  gulp.watch([
    'dist/**/*.js',
    'demo/**/*'
  ], browserSync.reload);
});

/**
 * Main development task
 */
gulp.task('develop', function () {
  runSequence('javascript', 'serve:client', 'watch', 'nodemon');
});