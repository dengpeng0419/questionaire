// webpack 只用来做下面的事情：
// 1. JS依赖组合。
// 2. 编译LESS。
// 3. 优化图片。
var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
// 模块别名配置
var entryJson = require('./entry.json');
// 输出路径
var outputPath = path.resolve('./temp/');
// 打包时会自将资源路径替换为 publicPath + output.filename
var publicPath = '../';

module.exports = {
    entry: entryJson.entry,
    output: {
        // 配置输出路径
        path: outputPath,
        // 打包时会自将资源路径替换为 publicPath + output.filename
        publicPath: publicPath,
        // 输出文件名
        filename: 'js/[name].js',
        // 基础框架库的引入形式
        libraryTarget: 'var'
    },
    module: {
        // 配置不依赖于任何模块的模块（webpack将不会扫描没有依赖的模块，提高打包速度）
        noParse: [/zepto/i, /template/i],
        // 加载器配置
        loaders: [
            // 压缩优化图片
            {
                test: /\.(?:jpe?g|png|gif|svg)$/i,
                loaders: [
                    'image-webpack?{progressive:true, optimizationLevel: 7, interlaced: false, pngquant:{quality: "65-90", speed: 4}}',
                    'url?limit=3000&name=images/[name].[ext]'
                ]
            },
            // 优化字体图标
            {
                test: /\.ttf$/i,
                loader: 'url?limit=3000&name=fonts/[name].[ext]'
            },
            // 页面相关样式打包到一个文件中
            {
                test: /\.less$/i,
                loader: ExtractTextPlugin.extract("style-loader", "css-loader!less-loader"),
                include: [
                    path.resolve(__dirname, 'src/css')
                ]
            },
            // 组件相关样式打包到 style 中
            {
                test: /\.(?:less|css)$/i,
                loader: 'style?singleton!css!less',
                include: [
                    path.resolve(__dirname, 'src/js/components')
                ]
            }
        ]
    },
    resolve: {
        // 配置搜索路径(查找module的话从这里开始查找)
        root: path.resolve(process.cwd()),
        // 模块别名定义，方便后续直接引用别名，无须多写长长的地址
        alias: entryJson.alias
    },
    // 配置不需要被 webpack 处理的依赖
    externals: {
        "zepto": "$",
        "template": "template"
    },
    plugins: [
        new ExtractTextPlugin("css/[name].css")
    ]
};
