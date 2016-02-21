var express = require("express");
var path = require("path");
var unirest = require("unirest");
var stAuth = require("./lib/st-auth.js");

var app = express();

var webroot = path.join(__dirname, "htdocs");
var options = {
  index: "index.html"
};

app.get("/", express.static(webroot, options));

app.get("/authorize", stAuth.authorizeHandler);
app.get("/authorize/callback", stAuth.authorizeHandler.callback, function(req, res) {  
  res.redirect("/api");
});

app.use("/api", function(req, res, next) {
  if(!stAuth.getAuthToken()) {
    res.status(403).json({
      message: "Server is not authenticated to SmartThings."
    });
    return;
  }
  
  next();
});

app.get("/api", function(req, res) {
  unirest.get("https://graph.api.smartthings.com/api/smartapps/endpoints")
     .headers({"Authorization": "Bearer " + stAuth.getAuthToken()})
    .end(function(response) {
      res.send(response.body);
    });  
});

app.get("/api/heaters", function(req, res) {
  res.send("You did it!");
});

app.listen(3000);