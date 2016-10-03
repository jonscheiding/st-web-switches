var path = require('path')
require('babel-register')
require('app-module-path').addPath(path.resolve(__dirname, 'src2'))

var server = require('server').default
server.start(process.env.PORT || 5000)