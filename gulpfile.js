var gulp = require("gulp"),
  spritesmith = require('gulp.spritesmith'),
  wiredep = require('wiredep').stream,
  plumber = require('gulp-plumber'),
  buffer = require('gulp-buffer'),
  merge = require('gulp-merge'),
  autoprefixer = require('gulp-autoprefixer'),
  jade = require('gulp-jade'),
  browserSync = require('browser-sync'),
  sass = require('gulp-sass'),
  uncss = require('gulp-uncss'),
  paths = {
    jade:['app/markup_jade/_pages/*.jade'],
    sass:['app/scss/compile/*.scss'],
    sprites:['app/img/sprites/*.png'],
  };

// сборка html css javascript + удаление папки dist
var rimraf = require('gulp-rimraf'),    
    useref = require('gulp-useref'),    
    uglify = require('gulp-uglify'),
    gulpif = require('gulp-if'), 
    cleanCSS = require('gulp-clean-css');

// финальная сборка
var filter = require('gulp-filter'), 
    imagemin = require('gulp-imagemin'),
    size = require('gulp-size');

// Перенос шрифтов
    gulp.task('fonts', function() {
      gulp.src('app/fonts/*')
        .pipe(filter(['*.eot','*.svg','*.ttf','*.woff','*.woff2']))
        .pipe(gulp.dest('dist/fonts/'))
    });

// Остальные файлы, такие как favicon.ico и пр.
    gulp.task('extras', function () {
      return gulp.src([
        'app/*.*',
        '!app/*.html'
      ]).pipe(gulp.dest('dist'));
    });

// Картинки
    gulp.task('images', function () {
      return gulp.src('app/img/**/*')
        .pipe(imagemin({
          progressive: true,
          interlaced: true
        }))
        .pipe(gulp.dest('dist/img'));
    });

// Генерация спрайтов
    gulp.task('sprite', function () {
      // Создание спрайта
      var spriteData = gulp.src(paths.sprites).pipe(spritesmith({
        imgName: 'sprite.png',
        cssName: '_sprite.scss',
        imgPath: '../img/sprite.png',
        algorithm: 'binary-tree',
        padding: 70,
      }));
      var cssDest = spriteData.css.pipe(gulp.dest('app/scss/_common/')); // Путь к scss спрайта
      // Оптимизация изображения
      var imgStream = spriteData.img
          .pipe(buffer())
          .pipe(imagemin())
          .pipe(gulp.dest('app/img/'));
      return merge(imgStream, cssDest);
    });

// Следим за bower
  gulp.task('wiredep', function () {
    gulp.src('app/*.html')
      .pipe(wiredep({
        exclude: [ 'bower/modernizr/modernizr.js' ]
      }))
      .pipe(gulp.dest('app/'))
  });

  // Компиляция jade
  gulp.task('jade', function () {
    gulp.src(paths.jade)
      .pipe(plumber())
      .pipe(jade({pretty:true}))
      .pipe(wiredep({
        exclude: [ 'bower/modernizr/modernizr.js' ]
      }))
      .pipe(gulp.dest('app/'));
  });

  // Компиляция sass
  gulp.task('sass', function () {
    gulp.src(paths.sass)
      .pipe(plumber())
      .pipe(sass({outputStyle:'compressed'}))
      .pipe(autoprefixer())
      // .pipe(uncss({
      //   html: ['app/*.html']
      // }))
      .pipe(gulp.dest('app/css/'));
  });

  gulp.task('server', function () {
    browserSync({
      port: 9000,
      server: {
        baseDir: 'app'
      }
    });
  });

  gulp.task('watch', function() {
    gulp.watch([
      'app/*.html',
      'app/js/**/*.js',
      'app/css/**/*.css'
    ]).on('change', browserSync.reload);
    gulp.watch('bower.json', ['wiredep']);
    gulp.watch('app/markup_jade/**/*.jade', ['jade']);
    gulp.watch('app/scss/**/*.scss', ['sass']);
  });

  gulp.task('default', ['server', 'watch']);

  // Переносим HTML, CSS, JS в папку dist 
  gulp.task('useref', function () {
    return gulp.src('app/*.html')
      .pipe(useref())
      .pipe(gulpif('*.js', uglify()))
      .pipe(gulpif('*.css', cleanCSS({compatibility: 'ie8'})))
      .pipe(gulp.dest('dist'));
  });

  // Очистка
    gulp.task('clean', function() {
      return gulp.src('dist', { read: false }) 
        .pipe(rimraf());
    });

    // Сборка и вывод размера содержимого папки dist
gulp.task('dist', ['useref', 'images', 'fonts', 'extras'], function () {
  return gulp.src('dist/**/*').pipe(size({title: 'build'}));
});

// Собираем папку DIST (только после компиляции Jade)
gulp.task('build', ['clean'], function () {
  gulp.start('dist');
});