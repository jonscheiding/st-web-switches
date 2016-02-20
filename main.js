var express = require("express");
var path = require("path");
var oauth2 = require("simple-oauth2")({
  clientID: "5db657c1-4b11-4b01-b1b9-ce92f3eb37e4",
  clientSecret: "bd3da063-5586-430a-9a09-d1dee76e58dd",
  site: "https://graph.api.smartthings.com/",
  authorizationPath: "/oauth/authorize",
  tokenPath: "/oauth/token"
});

var app = express();
var auth_token = null;
var auth_uri = oauth2.authCode.authorizeURL({
  redirect_uri: "http://localhost:3000/authorize/callback",
  scope: "app",
  state: "&h51H~"
});

var webroot = path.join(__dirname, "htdocs");
var options = {
  index: "index.html"
};

app.get("/", express.static(webroot, options));

app.get("/authorize", function(req, res) {res.redirect(auth_uri);});
app.get("/authorize/callback", function(req, res) {
  var code = req.query.code;
  
  oauth2.authCode.getToken({
    code: code,
    redirect_uri: "http://localhost:3000/authorize/callback"
  }, function(error, result) {
    auth_token = oauth2.accessToken.create(result);
    console.log(auth_token);
    res.redirect("/");
  })
})

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