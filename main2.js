var path = require('path')
require('dotenv').config()
require('babel-register')
require('app-module-path').addPath(path.resolve(__dirname))

var server = require('src2/server').default
server.start(process.env.PORT || 5000)