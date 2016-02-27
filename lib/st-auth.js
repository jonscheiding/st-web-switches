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

var auth_token = null;
var auth_token = oauth2.accessToken.create({"access_token":"9e4eb31a-8fb2-43ed-a6dc-9b9b3b34082a","token_type":"bearer","expires_in":1576617961,"scope":"app","expires_at":"2066-02-06T17:30:20.738Z"});

function buildRedirectUri(req) {
  return req.protocol + "://" + req.get("host") + "/authorize/callback";
}

function isAuthorized() {
  return auth_token != null;
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
    auth_token = oauth2.accessToken.create(result);

    console.log("Received auth token " + JSON.stringify(result));
  
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
  return "Bearer " + auth_token.token.access_token;
}

module.exports = {};
module.exports.express = {
  authorizeRedirect : expressAuthorizeRedirectMiddleware,
  authorizeCallback : expressAuthorizeCallbackMiddleware,
  requireAuthorization: expressRequireAuthorizationMiddleware
};

module.exports.getAuthorization = getAuthorization;
