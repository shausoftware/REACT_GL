var path = require('path');
var webpack = require('webpack');

module.exports = {
    mode: "development",
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
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader"
          }
        },
        {
          test: /\.(jpe?g|png|gif|unity3d|obj)$/i,   //to support eg. background-image property 
          exclude: /node_modules/,
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
    }
};