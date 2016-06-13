//
// Handles the OAuth authentication to the SmartThings API.  The purpose of this
// module is to provide ExpressJS middleware which can be used to handle 
// authenticating to the SmartThings API; and to store the authorization token
// once received.
// 

var winston = require("winston");

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
  return req.protocol + "://" + req.get("host") + module.exports.express.callbackUrl;
}

function isAuthorized() {
  return authToken != null;
}

//
// Middleware that redirects to the SmartThings authorization URL, with an
// appropriate callback url.
//
function expressAuthorizeRedirectMiddleware(req, res) {
  var auth_uri = oauth2.authCode.authorizeURL({
    redirect_uri: buildRedirectUri(req),
    scope: "app"
  });
  winston.info("Redirecting to " + auth_uri + " for authorization.");
  res.redirect(auth_uri);
}

//
// Middleware that handles the callback from the SmartThings authorization URL,
// retrieving and storing an auth token before calling the next middleware in
// the stack.
//
function expressAuthorizeCallbackMiddleware(req, res, next) {  
  var code = req.query.code;
  
  winston.info("Received authorization code " + code + ".");
  
  oauth2.authCode.getToken({
    code: code,
    redirect_uri: buildRedirectUri(req)
  }, function(error, result) {
    if(error) {
      winston.error("Error getting access token: " + error);
      next();
      return;
    }
    winston.info("Received access token " + JSON.stringify(result));
  
    storage.save(null, result);
    authToken = oauth2.accessToken.create(result);

    next();
  });  
}

//
// Middleware that breaks the request off with a 401 if we don't have SmartThings
// authorization
//
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

function getAccessToken() {
  return authToken.token.access_token;
}

module.exports = { 
  //
  // Callback URL should be set by the consuming code.  It should be relative
  // (host and protocol are determined from the request context).
  //
  callbackUrl: null,
  getAccessToken: getAccessToken,
  express: {
    authorizeRedirect : expressAuthorizeRedirectMiddleware,
    authorizeCallback : expressAuthorizeCallbackMiddleware,
    requireAuthorization: expressRequireAuthorizationMiddleware
  }
};
