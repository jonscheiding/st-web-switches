var express = require("express");
var path = require("path");
var moment = require("moment");
var stAuth = require("./lib/st-auth.js");
var stApp = require("./lib/st-app.js");
var timers = require("./lib/timers.js");

var app = express();

var powerTimeout = moment.duration(5, "seconds");

timers.on("timesUp", function(id) {
  console.log("Time's up for " + id);
});

function addSwitchLinks(sw) {
  sw.links = {
    self: "/api/switches/" + sw.id,
    on: "/api/switches/" + sw.id + "/on",
    off: "/api/switches/" + sw.id + "/off"
  };
}

var webroot = path.join(__dirname, "htdocs");
var options = {
  index: "index.html"
};

app.use("/", express.static(webroot, options));
app.get("/authorize", stAuth.express.authorizeRedirect);
app.get("/authorize/callback", stAuth.express.authorizeCallback, function(req, res) {  
  res.redirect("/");
});
app.use("/api", stAuth.express.requireAuthorization);

app.get("/api", function(req, res) {
  res.send({
    links: {
      switches: "/api/switches"
    }
  })
});

app.get("/api/switches", stApp.call({
  handleResponse: function(stResponse) {
    if(!stResponse.ok) return;
    stResponse.body.forEach(addSwitchLinks);    
  }
}));

app.get("/api/switches/:id", stApp.call({
  handleResponse: function(stResponse) {
    if(!stResponse.ok) return;
    addSwitchLinks(stResponse.body);
  }
}));

app.put("/api/switches/:id/:state", stApp.call({
  handleResponse: function(stResponse, req) {
    if(!stResponse.ok) return;
    
    if(req.params.state == "on") {
      timers.start(req.params.id, powerTimeout);
    }
    
    return function(req, res) {
      res.redirect(303, "/api/switches/" + req.params.id);
    };
  }
}));

app.listen(process.env.PORT || 5000);
