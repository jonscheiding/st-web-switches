var unirest = require("unirest");
var merge = require("merge");
var winston = require("winston");

var stAuth = require("./st-auth.js");

var baseUri = "https://graph.api.smartthings.com:443/api/smartapps/installations/d2ac3ea0-e77e-4ae7-9991-670a8227a1a4"

module.exports.call = function(options, done) {
  var method = options.method.toLowerCase();
  var url = options.url;
  
  unirest[method](baseUri + url)
    .headers({Authorization: stAuth.getAuthorization()})
    .end(function(stResponse) {
      winston.info("SmartThings API %s %s %d %j", method.toUpperCase(), url, stResponse.status, stResponse.body);
      
      if(done) {
        done(stResponse);
      }
    });
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