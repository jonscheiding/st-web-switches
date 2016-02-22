var express = require("express");
var path = require("path");
var unirest = require("unirest");
var stAuth = require("./lib/st-auth.js");

var app = express();

var webroot = path.join(__dirname, "htdocs");
var options = {
  index: "index.html"
};

app.use("/", express.static(webroot, options));

app.get("/authorize", stAuth.authorizeHandler);
app.get("/authorize/callback", stAuth.authorizeHandler.callback, function(req, res) {  
  res.redirect("/");
});

app.use("/api", function(req, res, next) {
  if(!stAuth.isAuthorized()) {
    res.status(403).json({
      message: "Server is not authorized to SmartThings."
    });
    return;
  }
  
  next();
});

app.use("/api", function(req, res) {
  var baseUri = "https://graph.api.smartthings.com:443/api/smartapps/installations/36be958e-8940-4f73-975a-ae72f00a9503";
  unirest[req.method.toLowerCase()](baseUri + req.originalUrl.replace("/api",""))
    .headers({Authorization: stAuth.getAuthorization()})
    .end(function(response) {
      console.log(response.body);
      res.status(response.status);
      res.send(response.body);
    });
});

app.listen(3000);