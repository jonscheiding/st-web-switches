import path from 'path'
import webpack from 'webpack'
import webpackMiddleware from 'webpack-dev-middleware'

const config = {
  devtool: 'source-map',
  entry: './htdocs/switch-app.js',
  output: {
    filename: 'switch-app.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/'
  },
  module: {
    loaders: [
      { test: /\.jsx?$/, exclude: /node_modules/, loaders: ['babel'] }
    ]
  },
  externals: {
    'angular': 'angular'
  }
}

const compiler = webpack(config)
export default () => webpackMiddleware(compiler, { publicPath: config.output.publicPath })
