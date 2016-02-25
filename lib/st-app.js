var unirest = require("unirest");
var merge = require("merge");
var stAuth = require("./st-auth.js");

var baseUri = "https://graph.api.smartthings.com:443/api/smartapps/installations/a5c0a34f-3ee2-4928-8afe-eda9c15e4fd7"

module.exports.call = function(options, done) {
  var method = options.method.toLowerCase();
  var url = options.url;
  
  unirest[method](baseUri + url)
    .headers({Authorization: stAuth.getAuthorization()})
    .end(done);
}

module.exports.passthrough = function(options) {
  return function(req, res) {
    var defaultOptions = {
      method: req.method,
      //
      // TODO: Handling the stripping of /api here is sort of hacky, should be a 
      // concern of main
      //
      url: req.originalUrl.replace(/^\/api/, "")
    };
    
    var mergedOptions = merge(true, defaultOptions, options);
    
    module.exports.call(mergedOptions, function(stResponse) {
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