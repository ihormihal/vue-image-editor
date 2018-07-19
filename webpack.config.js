const webpack = require('webpack');
const path = require('path');
const autoprefixer = require('autoprefixer');

const ExtractTextPlugin = require('extract-text-webpack-plugin');


module.exports = {
  entry: {
    bundle: './client/app/main.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, './public/assets/js'),
    hotUpdateChunkFilename: 'hot/hot-update.js',
    hotUpdateMainFilename: 'hot/hot-update.json'
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      '@': __dirname+'/client/app'
    }
  },
  devtool: '#eval-source-map',
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract(['css-loader', 'sass-loader'])
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '../img/[name].[ext]?[hash]'
        }
      },
      {
        test: /\.(ttf|woff|woff2)$/,
        loader: 'file-loader',
        options: {
          name: '../fonts/[name].[ext]?[hash]'
        }
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin('../css/styles.css', {
      allChunks: true
    }),
    new webpack.LoaderOptionsPlugin({
      options: {
        postcss: [
          autoprefixer('last 2 versions', 'ie 10')
        ]
      }
    }),
    new webpack.HotModuleReplacementPlugin()
  ]
};
