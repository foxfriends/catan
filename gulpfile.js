'use strict';
var gulp = require('gulp');
var fs = require('fs');

var files = fs.readdirSync('gulptasks');
files.forEach(function(f) {
    require('./gulptasks/' + f);
});

gulp.task('build', ['clean', 'transpile', 'move_image', 'move_html', 'sass']);
gulp.task('default', ['build']);
