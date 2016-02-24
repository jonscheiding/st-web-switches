var express = require("express");
var path = require("path");
var unirest = require("unirest");
var stAuth = require("./lib/st-auth.js");
var stApp = require("./lib/st-app.js");

var app = express();
var stPassthrough = stApp.passthrough({
  transformUrl: function(url) {
    return url.replace(/^\/api/, "");
  }
});

function addSwitchLinks(sw) {
  sw.links = {
    self: "/api/switches/" + sw.id,
    on: "/api/switches/" + sw.id + "/on",
    off: "/api/switches/" + sw.id + "/off"
  };
}

function enrichSwitch(response) {
  addSwitchLinks(response.body);
}

function enrichSwitches(response) {
  response.body.forEach(addSwitchLinks);
}

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

app.get("/api", function(req, res) {
  res.send({
    links: {
      switches: "/api/switches"
    }
  })
});
app.get("/api/switches/:id", stPassthrough(enrichSwitch));
app.get("/api/switches", stPassthrough(enrichSwitches));
app.use("/api/*", stPassthrough());

app.listen(process.env.PORT || 5000);
