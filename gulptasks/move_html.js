'use strict';
var gulp = require('gulp');

gulp.task('move_html', function() {
    gulp.src('./src/**/*.html')
        .pipe(gulp.dest('public_html'));
});
