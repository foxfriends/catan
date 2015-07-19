'use strict';
var gulp = require('gulp');
var del = require('del');

gulp.task('reset_games', function() {
    del('games/**/*');
});
