var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var autoprefixer = require('autoprefixer');
var mainBowerFiles = require('main-bower-files');
var cleanCSS = require('gulp-clean-css');
var minimist = require('minimist');
var gulpSequence = require('gulp-sequence');

let envOptions = {
  string: 'env',
  default: {env: 'develop'}
}
let option = minimist(process.argv.slice(2),envOptions);
console.log(option);

gulp.task('clean', function () {
    return gulp.src(['./.tmp', './public'], {read: false})
        .pipe($.clean());
});

gulp.task('copyHTML', function(){
  return gulp.src('./source/**/*.html')
    .pipe($.plumber())
    .pipe(gulp.dest('./public/'))
});

gulp.task('sass', function () {
  var plugins = [
      autoprefixer({browsers: ['last 3 version','> 5%','ie 8']})
  ];
  return gulp.src('./source/scss/*.scss')
    .pipe($.sourcemaps.init())
    .pipe($.plumber())
    .pipe($.sass({
      'includePaths': ['./bower_components/bootstrap-sass/assets/stylesheets','bower_components/font-awesome/scss/font-awesome.scss']
     }).on('error', $.sass.logError))
    .pipe($.postcss(plugins))
    .pipe($.if(option.env === 'production', cleanCSS()))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/css'));
});

gulp.task('babel', () =>
  gulp.src('./source/**/*.js')
    .pipe($.sourcemaps.init())
    .pipe($.plumber())
    .pipe($.babel({
        presets: ['es2015']
    }))
    .pipe($.concat('all.js'))
    .pipe($.if(option.env === 'production', $.uglify()))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/js'))
);

gulp.task('bower', function(){
  return gulp.src(mainBowerFiles({
    "overrides": {
      "bootstrap-sass": {
        "main": [
          "assets/stylesheets/_bootstrap.scss",
          "assets/javascripts/bootstrap.js"
        ]
      }
    }
  }))
    .pipe(gulp.dest('./.tmp/vendors'))
});

gulp.task('vendorCss', ['bower'], function(){
  return gulp.src('./.tmp/vendors/*.css')
    .pipe($.sourcemaps.init())
    .pipe($.plumber())
    .pipe($.if(option.env === 'production', cleanCSS()))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('./public/css'))
});

gulp.task('vendorJs', ['bower'], function(){
  return gulp.src('./.tmp/vendors/*.js')
    .pipe($.plumber())
    .pipe($.order([
      'jquery.js',
      'bootstrap.js',
      'owl.carousel.js'
    ]))
    .pipe($.concat('vendor.js'))
    .pipe($.if(option.env === 'production', $.uglify()))
    .pipe(gulp.dest('./public/js'))
});
  
gulp.task('icon',function(){
  return gulp.src('./bower_components/bootstrap-sass/assets/fonts/bootstrap/*')
    .pipe($.plumber())
    .pipe(gulp.dest('./public/fonts/bootstrap'))
})

gulp.task('image-min', () =>
  gulp.src('./source/images/*')
    .pipe($.if(option.env === 'production', $.imagemin()))
    .pipe(gulp.dest('./public/images'))
);

gulp.task('watch', function () {
  gulp.watch('./source/**/*.html', ['jade']);
  gulp.watch('./source/scss/**/*.scss', ['sass'])
  gulp.watch('./source/js/**/*.js', ['babel'])
});

gulp.task('bulid', gulpSequence('clean', 'copyHTML', 'sass', 'babel','vendorCss', 'vendorJs','icon' ,'image-min'));

gulp.task('default',['copyHTML', 'sass', 'babel', 'vendorCss','vendorJs','icon', 'watch']);