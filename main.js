var express = require("express");
var path = require("path");

var app = express();

var webroot = path.join(__dirname, "htdocs");
var options = {
  index: "index.html"
};

app.get("/", express.static(webroot, options));

app.listen(3000);