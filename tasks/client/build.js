'use strict';

var gulpSize   = require('gulp-size');

// browserify
var browserify = require('browserify');
var source     = require('vinyl-source-stream');
var buffer     = require('vinyl-buffer');
var gutil      = require('gulp-util');
var uglify     = require('gulp-uglify');

module.exports = function (gulp) {

  /**
   * Compile client library
   */
  gulp.task('javascript:client', function () {
    // set up the browserify instance on a task basis
    var b = browserify({
      entries: './client/index.js',
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
      .pipe(source('h-auth-client.js'))
      .pipe(buffer())
      // calculate size before writing source maps
      .pipe(gulpSize({
        title: 'javascript:client',
        showFiles: true
      }))
      .pipe(gulp.dest('./dist/'));
  });

  gulp.task('javascript', ['javascript:client']);

};