'use strict';
var gulp = require('gulp');

gulp.task('move_image', function() {
    gulp.src('./src/image/**/*')
        .pipe(gulp.dest('public_html/image'));
});
