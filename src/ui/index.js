import express from 'express'
import path from 'path'
import webpack from 'webpack'
import webpackMiddleware from 'webpack-dev-middleware'

const webroot = path.resolve(__dirname, 'static')
const options = {
  index: 'index.html'
}

export default (config) => {
  const { TIMER_DEFAULT, LOG_LEVEL } = config

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
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
           // Note the quotes, this is weird but necessary because otherwise it tries
           // to treat the date (e.g. 1970-01-01) as an expression.
          TIMER_DEFAULT: `"${TIMER_DEFAULT}"`,
          LOG_LEVEL: `"${LOG_LEVEL}"`,
          WEBPACK: true
        }
      })
    ],
    resolve: {
      alias: {
        bunyan: 'browser-bunyan',
        'express-bunyan-logger': 'empty-module'
      },
      root: [
        path.resolve('.')
      ]
    }
  })

  const ui = express.Router()
  ui.use('/', express.static(webroot, options))
  ui.use(webpackMiddleware(webpackCompiler, { publicPath: '/dist/' }))

  return ui
}