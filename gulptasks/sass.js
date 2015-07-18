'use strict';
var gulp = require('gulp');
var sass = require('gulp-sass');
gulp.task('sass', function() {
    gulp.src('./src/style/**/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('public_html/style'));
});
