var oauth2 = require("simple-oauth2")({
  clientID: "5db657c1-4b11-4b01-b1b9-ce92f3eb37e4",
  clientSecret: "bd3da063-5586-430a-9a09-d1dee76e58dd",
  site: "https://graph.api.smartthings.com",
  authorizationPath: "/oauth/authorize",
  tokenPath: "/oauth/token"
});

var auth_token = null;
var auth_token = oauth2.accessToken.create({"access_token":"9e4eb31a-8fb2-43ed-a6dc-9b9b3b34082a","token_type":"bearer","expires_in":1576617961,"scope":"app","expires_at":"2066-02-06T17:30:20.738Z"});

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

    console.log("Received auth token " + JSON.stringify(result));
  
    next();
  });  
}

function expressEnsureAuthorized(req, res, next) {
  if(isAuthorized()) {
    next();
    return;
  }
  
  res.status(403).json({
    message: "Server is not authorized to SmartThings."
  });
  return;
}

function isAuthorized() {
  return auth_token != null;
}
function getAuthorization() {
  return "Bearer " + auth_token.token.access_token;
}

module.exports = {};
module.exports.authorizeHandler = expressAuthorize;
module.exports.authorizeHandler.callback = expressAuthorizeCallback;
module.exports.ensureAuthorized = expressEnsureAuthorized;
module.exports.getAuthorization = getAuthorization;
