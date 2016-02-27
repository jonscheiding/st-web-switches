var storage = require("./storage.js")("authorization_token");

if(!process.env.ST_OAUTH_ID || !process.env.ST_OAUTH_SECRET) {
  throw new Error("SmartThings OAuth info not set.  Please make sure ST_OAUTH_ID and ST_OAUTH_SECRET are in the environment.")
}

var oauth2 = require("simple-oauth2")({
  clientID: process.env.ST_OAUTH_ID,
  clientSecret: process.env.ST_OAUTH_SECRET,
  site: "https://graph.api.smartthings.com",
  authorizationPath: "/oauth/authorize",
  tokenPath: "/oauth/token"
});

var authToken = null;

storage.load(function(result) {
  if(!result) { return; }
  authToken = oauth2.accessToken.create(result);
});

function buildRedirectUri(req) {
  return req.protocol + "://" + req.get("host") + "/authorize/callback";
}

function isAuthorized() {
  return authToken != null;
}

function expressAuthorizeRedirectMiddleware(req, res) {
  var auth_uri = oauth2.authCode.authorizeURL({
    redirect_uri: buildRedirectUri(req),
    scope: "app"
  });
  console.log("Redirecting to " + auth_uri + " for authorization.");
  res.redirect(auth_uri);
}

function expressAuthorizeCallbackMiddleware(req, res, next) {  
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
    console.log("Received auth token " + JSON.stringify(result));
  
    authToken = oauth2.accessToken.create(result);
    storage.save(null, result);

    next();
  });  
}

function expressRequireAuthorizationMiddleware(req, res, next) {
  if(isAuthorized()) {
    next();
    return;
  }
  
  res.status(401).json({
    message: "Server is not authorized to SmartThings."
  });
  return;
}

function getAuthorization() {
  return "Bearer " + authToken.token.access_token;
}

module.exports = {};
module.exports.express = {
  authorizeRedirect : expressAuthorizeRedirectMiddleware,
  authorizeCallback : expressAuthorizeCallbackMiddleware,
  requireAuthorization: expressRequireAuthorizationMiddleware
};

module.exports.getAuthorization = getAuthorization;
