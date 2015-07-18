'use strict';

var gulp = require('gulp');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var globby = require('globby');

gulp.task('transpile', function() {
    browserify({
        entries: './src/script/main.es6',
        debug: true,
        standalone: 'Catan',
        extensions: ['js', 'json', 'es6']
    })
    .add(globby.sync(['./src/script/*.{js,es6}', '!./src/script/main.es6']))
    .transform(babelify.configure({
        only: ['es6']
    }))
    .bundle()
    .pipe(source('script/catan.js'))
    .pipe(buffer())
    //.pipe(uglify())
    .pipe(gulp.dest('public_html'));
});
