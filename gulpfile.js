// 面向纯前端项目（前后端完全分离）

var path = require('path');
var gulp = require('gulp');
var mock = require('./mock');
var gutil = require('gulp-util');
var clean = require('gulp-clean');
var uglify = require('gulp-uglify');
var cssnano = require('gulp-cssnano');
var pngquant = require('imagemin-pngquant');
var htmlmin = require('gulp-htmlmin');
var rev = require('gulp-rev');
var revCollector = require('gulp-rev-collector');
var webpack = require('webpack');
var webpackDevServer = require('webpack-dev-server');
var webpackConfig = require('./webpack.config.js');
var minimist = require('minimist');
var browserSync = require('browser-sync').create();
var replace = require('gulp-replace');
var publicPathReg = /\.\.\/(css|js|images)/ig;
var publicPath = webpackConfig.output.publicPath;

var argv = minimist(process.argv.slice(2));
var devPort = argv.p || '3333';
var colors = gutil.colors;
var log = gutil.log;
colors.enabled = true;
logTitColor = colors.black.bgCyan;
logConColor = colors.black.bgYellow;



/*********************************************************************************/
/**打包部分**/
/*********************************************************************************/


// 拷贝 html 至 webpack build 目录（临时目录）
gulp.task('replicateSrcHtml', function() {
  log(logTitColor('[复制优化html]'));
  return gulp.src('./src/html/*.html', {base: 'src'})
	.pipe(replace(publicPathReg, publicPath + '$1'))
    .pipe(htmlmin({
      //removeComments: true,
      minifyJS: true,
      minifyCSS: true
      //collapseWhitespace: true
    }))
    .pipe(gulp.dest('./temp'));
});
// 拷贝 js 基础框架至 dist 目录
gulp.task('replicateSrcJs', function() {
  log(logTitColor('[复制js lib]'));
  return gulp.src('./src/js/lib/*.js', {base: 'src'})
    .pipe(gulp.dest('./dist'));
});
// 拷贝 icons 至 dist 目录
gulp.task('replicateSrcIcons', function() {
  log(logTitColor('[复制icons]'));
  return gulp.src('./src/icons/**/*.*', {base: 'src'})
    .pipe(gulp.dest('./dist'));
});
// 拷贝 audios 至 dist 目录
gulp.task('replicateSrcAudios', function() {
  log(logTitColor('[复制audios]'));
  return gulp.src('./src/audios/**/*.*', {base: 'src'})
    .pipe(gulp.dest('./dist'));
});
// rev order:
// 1. img rev 至 dist 目录
// 2. 使用 img rev 替换 temp 中 css js html 中对应 img 名字
// 3. css rev 至 dist 目录
// 4. 使用 css rev 替换 temp 中 js html 中对应 css 名字
// 5. js rev 至 dist 目录
// 6. 使用 js rev 替换 temp 中 js html 中对应 js 名字

// 根据图片内容生成对应的 hash 来重命名图片文件
gulp.task('revIMG', ['replicateSrcHtml', 'replicateSrcJs', 'replicateSrcIcons', 'replicateSrcAudios'], function() {
  log(logTitColor('[复制优化html成功]'));
  log(logTitColor('[复制js lib成功]'));
  log(logTitColor('[优化图片]'));
  return gulp.src('./temp/images/**/*.{gif,png,jpg,jpeg}', {base: 'temp'})
    .pipe(rev())
    .pipe(gulp.dest('./dist'))
    .pipe(rev.manifest('rev-mf-img.json'))
    .pipe(gulp.dest('./dist/rev'));
});
// 替换 css js html 中对应图片的文件名为 rev 之后的文件名
gulp.task('revCollectorIMG', ['revIMG'], function() {
  log(logTitColor('[优化图片成功]'));
  log(logTitColor('[替换图片名称]'));
  return gulp.src(['./dist/rev/*img.json', './temp/**/*.{html,css,js}'])
    .pipe(revCollector({
      replaceReved: true,
      dirReplacements: {
        // key 为 JSP HTML 中 JS CSS 路径部分
        // value 替换 JSP HTML 中 JS CSS 路径部分
        //'${ctx}': '${ctx}/dist'
      }
    }))
    .pipe(gulp.dest('./temp'));
});
// 根据 CSS 内容生成对应的 hash 来重命名 css 文件
gulp.task('revCSS', ['revCollectorIMG'], function() {
  log(logTitColor('[替换图片名称成功]'));
  log(logTitColor('[优化CSS]'));
  return gulp.src('./temp/css/*.css', {base: 'temp'})
    .pipe(cssnano())
    .pipe(rev())
    .pipe(gulp.dest('./dist'))
    .pipe(rev.manifest('rev-mf-css.json'))
    .pipe(gulp.dest('./dist/rev'));
});
// 替换 js html 中对应 css 文件名为 rev 之后的文件名
gulp.task('revCollectorCSS', ['revCSS'], function() {
  log(logTitColor('[优化CSS成功]'));
  log(logTitColor('[替换CSS名称]'));
  return gulp.src(['./dist/rev/*css.json', './temp/**/*.{html,js}'])
    .pipe(revCollector({
      replaceReved: true
    }))
    .pipe(gulp.dest('./temp'));
});
// 根据 JS 内容生成对应的 hash 来重命名 js 文件
gulp.task('revJS', ['revCollectorCSS'], function() {
  log(logTitColor('[替换CSS名称成功]'));
  log(logTitColor('[优化JS]'));
  return gulp.src('./temp/js/*.js')
    .pipe(uglify())
    .pipe(rev())
    .pipe(gulp.dest('./dist/js'))
    .pipe(rev.manifest('rev-mf-js.json'))
    .pipe(gulp.dest('./dist/rev'));
});
// 替换 html js 中对应 js 文件名为 rev 之后的文件名
gulp.task('revCollectorJS', ['revJS'], function() {
  log(logTitColor('[优化JS成功]'));
  log(logTitColor('[替换JS名称]'));
  return gulp.src(['./dist/rev/*js.json', './temp/**/*.html', './dist/**/*.js', '!./dist/js/lib/*.js'])
    .pipe(revCollector({
      replaceReved: true
    }))
    .pipe(gulp.dest('./dist'));
});
// 清理 webpack build 目录（临时目录）
gulp.task('cleanWbb', ['revCollectorJS'], function() {
  log(logTitColor('[替换JS名称成功]'));
  log(logTitColor('[清理临时目录]'));
  return gulp.src(['./temp', './dist/rev'], {read: false})
    .pipe(clean({force: true}));
});
// 清理目标目录
gulp.task('clean', function() {
  log(logTitColor('[清理目标目录]'))
  return gulp.src('./dist', {read: false})
    .pipe(clean({force: true}));
});
// webpack 编译
gulp.task('webpackCompile', ['webpackCompileClean'], function(callback) {
  log(logTitColor('[webpack 编译清理temp目录成功]'));
  log(logTitColor('[webpack 编译]'));
  var compConf = Object.create(webpackConfig);
  webpack(compConf, function(err, stats) {
    if (err) {
      throw new gutil.PluginError('[webpack 编译失败]', err);
    }
    callback();
  });
});
// webpack 编译清理
gulp.task('webpackCompileClean', function() {
  gutil.log(logTitColor('[webpack 编译清理temp目录]'));
  return gulp.src('./temp', {read: false})
    .pipe(clean({force: true}));
});
// 构建
gulp.task('build', ['clean', 'webpackCompile'], function() {
  log(logTitColor('[清理目标目录成功]'));
  log(logTitColor('[webpack 编译成功]'));
  gulp.start(['cleanWbb'], function() {
    log(logTitColor('[清理临时目录成功]'));
    log(logTitColor('[构建成功]'));
  });
});
// 构建入口
gulp.task('default', function() {
  log(logTitColor('[构建]'));
  gulp.start(['build']);
});













/*********************************************************************************/
/**调试部分**/
/*********************************************************************************/

// 调试清理
/*gulp.task('webpackDevClean', function() {
  log(logTitColor('[webpack 调试清理]'));
  return gulp.src('./_webpackdev', {read: false})
    .pipe(clean({force: true}));
});
// 调试拷贝
gulp.task('webpackDevReplicator', ['webpackDevClean'], function() {
  log(logTitColor('[webpack 调试清理成功]'));
  log(logTitColor('[webpack 调试复制html,js lib]'));
  return gulp.src(['./src/html/*.html', './src/js/lib/*.*', './src/images/*.*'], {base: 'src'})
    .pipe(gulp.dest('./_webpackdev'));
});*/


// gulp.task('browsersync', function() {
//     browserSync.init({
//         open: 'external',
//         notify: false,
//         port: devPort,
//         /*server: {
//             baseDir: "./src",
//             directory: true
//         },*/
//         proxy: 'http://localhost:' + (devPort - 1)
//     });
//     gulp.watch(['gulpfile.js', './src/html/**/*', './src/js/**/*', './src/css/**/*', './src/images/**/*', './src/icons/**/*', './src/audios/**/*']).on("change", browserSync.reload);
// });

gulp.task('browsersync', function() {
	browserSync.init({
		open: 'external',
		notify: false,
		port: devPort,
		middleware: function(req, res, next) {
			var data = mock(req.url);
			if (data) {
				res.setHeader('Access-Control-Allow-Origin', '*');
				res.setHeader('Access-Control-Max-Age', 3600 * 24);
				res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
				res.end(JSON.stringify(data));
				return;
			}
			next();
		},
		/*server: {
			baseDir: "./src",
			directory: true
		},*/
		proxy: 'http://localhost:' + (devPort - 1)
	});
	gulp.watch(['gulpfile.js', './src/html/**/*', './src/js/**/*', './src/css/**/*', './src/images/**/*', './src/icons/**/*', './src/audios/**/*']).on("change", browserSync.reload);
});

// 调试
gulp.task('webpackDev', ['browsersync'], function() {
  log(logTitColor('[webpack 调试服务器启动]'));
  var devConf = Object.create(webpackConfig);
  var publicPath = '/';
  devConf.output.path = path.resolve(__dirname, '_webpackdev');
  // 官方说明：http://webpack.github.io/docs/webpack-dev-server.html
  // 默认 webpack-dev-server 设置当前工作目录为提供静态文件服务的目录
  // webpack-dev-server 将监视源资源文件的变化，并且当源资源文件发生变化后
  // 将会重新编译资源文件，被重新编译的资源文件从内存中以相对于 publicPath 的路径
  // 进行访问，webpack-dev-server 不会将被重新编译的资源文件写入到你配置的输出目录中
  // 默认情况下，如果一个资源文件存放的路径已经具有同一 url path ，那么将会优先使用
  // 内存中的资源文件
  // 举例说明：
  // contentBase = './_webpackdev' 设置在当前工作目录下的 _webpackdev 目录来提供静态文件服务
  // 即，可以通过 http://ip:port/xxx 的方式访问 _webpackdev 目录下的静态文件
  // xxx 即为 _webpackdev 目录中的文件
  // example: _webpackdev/js/index.js ==> http://ip:port/js/index.js
  // 此时如果设置 publicPath = '/'
  // 访问 http://ip:port/js/index.js
  // 因为 index.js 资源文件存放的路径 js/index.js 具有同一 url path，即为 js/index.js
  // 那么将会优先使用内存中的 js/index.js，而不会使用 _webpackdev/js/index.js
  new webpackDevServer(webpack(devConf), {
    // 提供静态文件服务的目录
    contentBase: './src',
    // 添加热模块替换插件并且切换 server 到热替换模式
    hot: true,
    // 由 webpack 编译的资源在内存中的访问路径：publicPath + output.path
    publicPath: publicPath,
    // 控制台不输出任何编译 log
    quiet: true
  }).listen((devPort - 1), '0.0.0.0', function(err) {
    if (err) {
      throw new gutil.PluginError('webpack-dev-server', err);
    }
    log(logTitColor('[webpack 调试服务器启动成功]'), logConColor('http://localhost:' + devPort + publicPath));
  });
});

