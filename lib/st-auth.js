var fs = require("fs");
var Datastore = require("nedb");

var oauth2 = require("simple-oauth2")({
  clientID: "5db657c1-4b11-4b01-b1b9-ce92f3eb37e4",
  clientSecret: "bd3da063-5586-430a-9a09-d1dee76e58dd",
  site: "https://graph.api.smartthings.com/",
  authorizationPath: "/oauth/authorize",
  tokenPath: "/oauth/token"
});

var auth_token = null;

var db = new Datastore({filename: "./data/authorization", autoload: true});
db.findOne({}, function(err, doc) {
  if(!doc) {
    console.log(err ? "Error loading authorization token: " + err : "Authorization token does not exist.")
    return;
  };
  
  console.log("Loaded authorization token " + JSON.stringify(doc));
  auth_token = oauth2.accessToken.create(doc);
});

function buildRedirectUri(req) {
  return req.protocol + "://" + req.get("host") + "/authorize/callback";
}

function expressAuthorize(req, res) {
  var auth_uri = oauth2.authCode.authorizeURL({
    redirect_uri: buildRedirectUri(req),
    scope: "app"
  });
  console.log("Redirecting to " + auth_uri + " for authorization.");
  res.redirect(auth_uri);
}

function expressAuthorizeCallback(req, res, next) {  
  var code = req.query.code;
  
  console.log("Received authorization code " + code + ".");
  
  oauth2.authCode.getToken({
    code: code,
    redirect_uri: buildRedirectUri(req)
  }, function(error, result) {
    if(error) {
      console.log("Error getting access token: " + error);
      next();
      return;
    }
    auth_token = oauth2.accessToken.create(result);
    db.insert(result);

    console.log("Received and stored auth token " + JSON.stringify(result));
  
    next();
  });  
}

function getAuthToken() {
  return auth_token ? auth_token.token.access_token : null;
}

module.exports = {};
module.exports.authorizeHandler = expressAuthorize;
module.exports.authorizeHandler.callback = expressAuthorizeCallback;
module.exports.getAuthToken = getAuthToken;