var path = require('path');
var webpack = require('webpack');

var node_dir = __dirname + '/node_modules';

module.exports = {
    entry: {
        main: './src/main/js/shau.js'
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery',
            Popper: ['popper.js', 'default'],
            // In case you imported plugins individually, you must also require them here:
            Util: "exports-loader?Util!bootstrap/js/dist/util",
            Dropdown: "exports-loader?Dropdown!bootstrap/js/dist/dropdown",
        })
    ],
    module: {
        loaders: [
            {
                test: path.join(__dirname, '.'),
                exclude: /(node_modules)/,
                loader: 'babel-loader',
                query: {
                    cacheDirectory: true,
                    presets: ['es2015', 'react']
                }
            },
            {
                test: /\.(jpe?g|png|gif|unity3d|obj)$/i,   //to support eg. background-image property 
                loader: 'file-loader?name=images/[name].[ext]',
            },
            {
                test: /\.(woff(2)?|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,    //to support @font-face rule 
                loader: "url-loader",
            },
            {
                test: /\.css$/,
                loaders: ['style-loader', 'css-loader']
            }
        ]
    },
};
