import path from 'path'
import webpack from 'webpack'
import webpackMiddleware from 'webpack-dev-middleware'

const config = {
  devtool: 'source-map',
  entry: path.resolve(__dirname, 'app.js'),
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/'
  },
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loaders: ['babel'] }
    ]
  },
  externals: {
    'angular': 'angular'
  }
}

const compiler = webpack(config)
export default () => webpackMiddleware(compiler, { publicPath: config.output.publicPath })
