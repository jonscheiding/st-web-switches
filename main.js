var express = require("express");
var path = require("path");

var app = express();
var auth_token = null;

var webroot = path.join(__dirname, "htdocs");
var options = {
  index: "index.html"
};

app.get("/", express.static(webroot, options));

app.use("/api", function(req, res, next) {
  if(!auth_token) {
    res.status(403).json({
      message: "Server is not authenticated to SmartThings."
    });
    return;
  }
  
  next();
});

app.get("/api/heaters", function(req, res) {
  res.send("You did it!");
});

app.listen(3000);