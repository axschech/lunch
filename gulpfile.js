var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var ngAnnotate = require('gulp-ng-annotate');

gulp.task('default', function () {
    'use strict';
    return gulp.src('./src/**/*.js')
        .pipe(concat('all.js'))
        .pipe(ngAnnotate())
        .pipe(uglify({
            compress: true
        }))
        .pipe(gulp.dest('./dist/'));
});