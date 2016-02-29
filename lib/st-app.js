var unirest = require("unirest");
var merge = require("merge");
var util = require("util");
var winston = require("winston");

var stAuth = require("./st-auth.js");
var storage = require("./storage.js")("smartapp_endpoint_uri");

var powerThreshold = process.env.POWER_THRESHOLD || 20;

var metaUri = "https://graph.api.smartthings.com/api/smartapps/endpoints";
var baseUri;

var handlers = [
  { url: /^\/switches\/?$/, method: function(stResponse) { winston.info(stResponse.body); stResponse.body.forEach(checkSwitchPower); } },
  { url: /^\/switches\/.*/, method: function(stResponse) { checkSwitchPower(stResponse.body); } }
];

storage.load(function(value) {
  baseUri = value;
});

function checkSwitchPower(sw) {
  if(sw.state.is != "on" || typeof(sw.state.power) == "undefined") {
    return;
  }
  
  sw.state.inUse = (sw.state.power >= powerThreshold);
}

function findHandler(url) {
  var foundHandler;
  handlers.forEach(function(handler) {
    if(handler.url.test(url)) {
      winston.info("Found handler %s for %s.", util.inspect(handler), url);
      foundHandler = handler.method;
    }
  });
  return foundHandler;
}

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
  
  makeRequest(method, baseUri + url, function(stResponse) {
    var handler = findHandler(url);
    if(handler) {
      handler(stResponse);
    }
    if(done) {
      done(stResponse);
    }
  });
}

module.exports.express = {
  initialize: function(req, res, next) {
    makeRequest("get", metaUri, function(stResponse) {
      if(stResponse.ok) {
        baseUri = stResponse.body[0].uri;
        storage.save(null, baseUri);
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
    fixupUrl = module.exports.passthrough.fixupUrl || function(s) {return s;};
    
    var defaultOptions = {
      method: req.method,
      //
      // TODO: Handling the stripping of /api here is sort of hacky, should be a 
      // concern of main
      //
      url: fixupUrl(req.originalUrl)
    };
    
    var mergedOptions = merge(true, defaultOptions, options);
    
    module.exports.call(mergedOptions, function(stResponse) {
      if(mergedOptions.handleResponse) {
        var next = mergedOptions.handleResponse(stResponse, req);
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