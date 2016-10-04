import express from 'express'
import path from 'path'
import webpack from 'webpack'
import webpackMiddleware from 'webpack-dev-middleware'

const ui = express.Router()

const webroot = path.resolve(__dirname, 'static')
const options = {
  index: 'index.html'
}

const webpackCompiler = webpack({
  devtool: 'source-map',
  entry: path.resolve(__dirname, 'app.js'),
  output: {
    filename: 'app.js',
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
})

ui.use('/', express.static(webroot, options))
ui.use(webpackMiddleware(webpackCompiler, { publicPath: '/dist/' }))

export default ui