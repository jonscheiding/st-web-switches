var stAuth = require("./st-auth.js");
var unirest = require("unirest");

var baseUri = "https://graph.api.smartthings.com:443/api/smartapps/installations/a5c0a34f-3ee2-4928-8afe-eda9c15e4fd7"

module.exports.passthrough = function(options) {
  return function(req, res) {
    var method = (options.method || req.method).toLowerCase();
    
    //
    // TODO: Handling the stripping of /api here is sort of hacky, should be a 
    // concern of main
    //
    var url = options.url || req.originalUrl.replace(/^\/api/, "");
    
    unirest[method](baseUri + url)
      .headers({Authorization: stAuth.getAuthorization()})
      .end(function(stResponse) {
        
        if(options.handleResponse) {
          var next = options.handleResponse(stResponse, req);
          if(next) {
            next(req, res);
            return;
          }
        }
        
        res.status(stResponse.status);
        res.send(stResponse.body);
      });
  }
};