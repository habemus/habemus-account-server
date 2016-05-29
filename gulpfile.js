'use strict';
var gulp        = require('gulp');
var runSequence = require('run-sequence');
var gulpNodemon = require('gulp-nodemon');

// tests
var istanbul    = require('gulp-istanbul');
var mocha       = require('gulp-mocha');

// browserSync
var browserSync = require('browser-sync').create();


// SERVER //

/**
 * Run server and restart it everytime server file changes
 */
gulp.task('nodemon', function () {
  gulpNodemon({
    script: 'cli/start.js',
    env: {
      PORT: '4000',
      MONGODB_URI: 'mongodb://localhost:27017/h-auth-development-db',
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
    .pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } }));
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
      baseDir: ['./demo', './dist']
    },
    open: true
  });
});

/**
 * Watch for changes and auto recompile
 */
gulp.task('watch', function () {
  gulp.watch('client/**/*.js', ['javascript:client']);
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