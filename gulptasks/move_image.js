'use strict';
var gulp = require('gulp');
var imagemin = require('gulp-imagemin');

gulp.task('compress_image', function() {
    gulp.src('./src/image/**/*')
      .pipe(imagemin())
      .pipe(gulp.dest('public_html/image'));
});
