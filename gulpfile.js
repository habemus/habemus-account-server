'use strict';
var gulp        = require('gulp');
var runSequence = require('run-sequence');
var gulpNodemon = require('gulp-nodemon');

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
      MONGODB_URI: 'mongodb://localhost:27017',
      SECRET: 'TEST_SECRET',
    },
    ext: 'js',
    ignore: [
      'client/**/*',
      'dist/**/*',
      'gulpfile.js',
    ],
  })
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