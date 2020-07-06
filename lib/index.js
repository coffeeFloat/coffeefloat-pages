const { src, dest, parallel, series, watch } = require('gulp');
const loadPlugins = require('gulp-load-plugins');
// const sass = require('gulp-sass');
// const babel = require('gulp-babel');
// const swig = require('gulp-swig');
// const imagemin = require('gulp-imagemin');
const plugins = loadPlugins();
const del = require('del');
const browserSync = require('browser-sync');

const bs = browserSync.create();
const cwd = process.cwd(); // 获取当前命令行所在目录（即项目根目录）
let config = {
  build: {
    src: 'src',
    dist: 'dist',
    temp: 'temp',
    public: 'public',
    paths: {
      styles: 'assets/styles/*.scss',
      scripts: 'assets/scripts/*.js',
      pages: '*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**',
    }
  },
};

try {
  const loadConfig = require(`${cwd}/pages.config.js`);
  config = Object.assign({}, config, loadConfig);
} catch(e) {};

const clean = () => {
  return del([config.build.dist, config.build.temp]);
};

const style = () => {
  return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.sass({ outputStyle: 'expanded' }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({stream: true}))
};

const script = () => {
  return src(config.build.paths.scripts, {base: config.build.src, cwd: config.build.src})
    .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({stream: true}))
};

const page = () => {
  return src(config.build.paths.pages, {base: config.build.src, cwd: config.build.src})
    .pipe(plugins.swig({ data: config.data, defaults: { cache: false } }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({stream: true}))
};

const image = () => {
  return src(config.build.paths.images, {base: config.build.src, cwd: config.build.src})
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
};

const font = () => {
  return src(config.build.paths.fonts, {base: config.build.src, cwd: config.build.src})
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
};

const extra = () => {
  return src('**', { base: config.build.public, cwd: config.build.public })
    .pipe(dest(config.build.dist))
};

const serve = () => {
  watch(config.build.paths.styles, {cwd: config.build.src}, style);
  watch(config.build.paths.scripts, {cwd: config.build.src}, script);
  watch(config.build.paths.pages, {cwd: config.build.src}, page);

  // 这类文件不需要在开发时编译，所以只需访问编译前文件即可
  // watch('src/assets/images/**', image);
  // watch('src/assets/fonts/**', font);
  // watch('public/**', extra);
  watch([
    config.build.paths.images,
    config.build.paths.fonts,
  ], { cwd: config.build.src }, bs.reload); // 当这三类文件变化时，刷新浏览器
  watch('**', {cwd: config.build.public}, bs.reload);

  bs.init({
    notify: false,
    port: 1003,
    // files: 'dist/**',
    server: {
      baseDir: [config.build.temp, config.build.src, config.build.public], // 按照順序查找文件
      routes: {
        '/node_modules': 'node_modules',
      },
    },
  });
};

// 上线前打包使用
const useref = () => {
  return src(config.build.paths.pages, {base: config.build.temp, cwd: config.build.temp})
    .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
    })))
    .pipe(dest(config.build.dist))
};

const compile = parallel(style, script, page);
// 上线前执行的任务
const build = series(
  clean, 
  parallel(
    series(compile, useref), 
    image, 
    font,
    extra
  )
);

// 开发构建
const develop = series(compile, serve);
module.exports = {
  build,
  develop,
  clean,
};