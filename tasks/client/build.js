'use strict';

const gulpSize   = require('gulp-size');
const gulpUglify = require('gulp-uglify');

// browserify
const browserify = require('browserify');
const source     = require('vinyl-source-stream');
const buffer     = require('vinyl-buffer');
const gutil      = require('gulp-util');
const brfs       = require('brfs');

module.exports = function (gulp) {

  /**
   * Compile client library
   */
  gulp.task('javascript:client', function () {
    // set up the browserify instance on a task basis
    var b = browserify({
      entries: './client/browser/index.js',
      // debug: true,
      // defining transforms here will avoid crashing your stream
      transform: [],

      // standalone global object for main module
      standalone: 'HAuthClient'
    });

    return b.bundle()
      .on('error', function (err) {
        gutil.log('Browserify Error', err);
        this.emit('end')
      })
      .pipe(source('h-account-client.js'))
      .pipe(buffer())
      .pipe(gulpUglify())
      // calculate size before writing source maps
      .pipe(gulpSize({
        title: 'javascript:client',
        showFiles: true
      }))
      .pipe(gulp.dest('./dist/'));
  });

  gulp.task('javascript:client-ui', function () {
    var b = browserify({
      entries: './client/browser/ui/dialog/index.js',
      transform: [brfs],

      // standalone global object for main module
      standalone: 'HAuthDialog'
    });

    return b.bundle()
      .on('error', function (err) {
        gutil.log('Browserify Error', err);
        this.emit('end');
      })
      .pipe(source('h-account-dialog.js'))
      .pipe(buffer())
      .pipe(gulpSize({
        title: 'javascript:client',
        showFiles: true
      }))
      .pipe(gulp.dest('./dist/'));
  });

  gulp.task('javascript', ['javascript:client', 'javascript:client-ui']);

};