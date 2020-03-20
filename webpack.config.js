'use strict';
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
module.exports = {
    mode: 'development',
    entry: './public_html/script/src/index.es6',
    output: {
        path: path.resolve('public_html'),
        filename: 'catan.js'
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader',
                ],
            },
            { test: /\.es6$/ }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin()
    ]
};
