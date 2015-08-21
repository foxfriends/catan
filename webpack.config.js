'use strict';
var ExtractTextPlugin = require('extract-text-webpack-plugin');
module.exports = {
    entry: './public_html/script/src/index.es6',
    output: {
        path: './public_html/',
        filename: 'script/catan.js'
    },
    module: {
        loaders: [
            { test: /\.scss$/, loader: ExtractTextPlugin.extract('style', 'css!sass') },
            { test: /\.es6$/, loader: 'babel' }
        ]
    },
    plugins: [
        new ExtractTextPlugin('style/main.css')
    ]
};
