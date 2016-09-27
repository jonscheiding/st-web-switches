require("dotenv").config();
var express = require("express");
var winston = require("winston");

var server = require('./server.js');

var app = express();
app.use(server);

var listenPort = process.env.PORT || 5000;

app.listen(listenPort);
winston.info("Listening on port %d", listenPort);