require('dotenv').config()
require('babel-register')
var express = require('express')
var winston = require('winston')

var server = require('./src/server.js').default

var app = express()
app.use(require('./fnllc-auth.js'))
app.use(server)

var listenPort = process.env.PORT || 5000

app.listen(listenPort)
winston.info('Listening on port %d', listenPort)
