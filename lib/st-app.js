var unirest = require("unirest");
var merge = require("merge");
var winston = require("winston");

var stAuth = require("./st-auth.js");

var metaUri = "https://graph.api.smartthings.com/api/smartapps/endpoints";
var baseUri;

function makeRequest(method, uri, done) {
  return unirest[method](uri)
    .headers({Authorization: stAuth.getAuthorization()})
    .end(function(stResponse) {
      winston.info("SmartThings API %s %s %d %j", method.toUpperCase(), uri, stResponse.status, stResponse.body);
      
      if(done) {
        done(stResponse);
      }
    });
}

module.exports.call = function(options, done) {
  var method = options.method.toLowerCase();
  var url = options.url;
  
  makeRequest(method, baseUri + url, done);
}

module.exports.express = {
  initialize: function(req, res, next) {
    makeRequest("get", metaUri, function(stResponse) {
      if(stResponse.ok) {
        baseUri = stResponse.body[0].uri;
      }
      next();
    });
  },
  ensureInitialized: function(req, res, next) {
    if(!baseUri) {
      res.status(401);
      res.send("URL for SmartThings installation has not been initialized.");
      return;
    }
    
    next();
  }
};

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