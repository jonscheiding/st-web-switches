//
// Handles talking to SmartThings st-power-control API.  The goal of this module
// is to make it easy to use ExpressJS to create a "proxy" to the SmartThings
// backend.  Client applications can then talk to the proxy without having to
// worry about exposing an OAuth access token.
//

var unirest = require("unirest");
var merge = require("merge");
var moment = require("moment");
var util = require("util");
var winston = require("winston");

var stAuth = require("./st-auth.js");
var storage = require("./storage.js")("smartapp_endpoint_uri");

//
// Minimum power usage to consider that something is "plugged in".  In Watts.
//
var powerThreshold = process.env.POWER_THRESHOLD || 20;
//
// After turning on a switch, it takes a few seconds before SmartThings reflects
// power usage.  This grace period is used to avoid having the switch show a 
// warning during this time.
//
var powerGracePeriod = 4;

var metaUri = "https://graph.api.smartthings.com/api/smartapps/endpoints";
var baseUri;

storage.load(function(value) {
  baseUri = value;
});

//
// For requests to /switches or /switches/:id, check the power usage so we can
// return an "unplugged" warning.  The word "middleware" here has a similar
// meaning to how ExpressJS uses it.
//
var middlewares = [
  { url: /^\/switches\/?$/, method: function(stResponse) { stResponse.body.forEach(addUnpluggedField); } },
  { url: /^\/switches\/[^/]*$/, method: function(stResponse) { addUnpluggedField(stResponse.body); } }
];

function addUnpluggedField(sw) {
  if(sw.state.is != "on" || typeof(sw.state.power) == "undefined") {
    return;
  }
  
  var timeOn = 0;
  if(sw.state.since) {
    timeOn = moment().diff(moment(sw.state.since), "seconds");
  }

  winston.info("Switch %s has been on for %d seconds and is drawing %d W.", sw.id, timeOn, sw.state.power);
  
  sw.state.unplugged = (timeOn > powerGracePeriod) && (sw.state.power < powerThreshold);
}

function findMiddlewareApplicableFor(url) {
  var foundMiddleware;
  middlewares.forEach(function(middleware) {
    if(middleware.url.test(url)) {
      winston.info("Found middleware %s for %s.", util.inspect(middleware), url);
      foundMiddleware = middleware.method;
    }
  });
  return foundMiddleware;
}

function makeRequest(method, uri, done) {
  return unirest[method](uri)
    .headers({Authorization: "Bearer " + stAuth.getAccessToken()})
    .end(function(stResponse) {
      winston.info("SmartThings API %s %s %d %j", method.toUpperCase(), uri, stResponse.status, stResponse.body);
      
      if(done) {
        done(stResponse);
      }
    });
}

//
// Simple method to call an endpoint on the API.
//
module.exports.call = function(options, done) {
  var method = options.method.toLowerCase();
  var url = options.url;
  
  makeRequest(method, baseUri + url, function(stResponse) {
    var middlewareMethod = findMiddlewareApplicableFor(url);
    if(middlewareMethod) {
      middlewareMethod(stResponse);
    }
    if(done) {
      done(stResponse);
    }
  });
}

//
// Method used to pass an ExpressJS request through to the SmartThings API,
// and return the API's response.  Basically "proxies" the SmartThings API to
// the browser.
//
module.exports.passthrough = function(options) {
  return function(req, res) {
    fixupUrl = module.exports.passthrough.fixupUrl || function(s) {return s;};
    
    var finalOptions = merge(true, {
      method: req.method,
      url: fixupUrl(req.originalUrl)
    }, options);
    
    module.exports.call(finalOptions, function(stResponse) {
      if(finalOptions.handleResponse) {
        var next = finalOptions.handleResponse(stResponse, req);
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

//
// Exports for integration into ExpressJS
//
module.exports.express = {
  //
  // Initialize call, goes out to SmartThings API to get the installation base
  // URL.
  //
  initialize: function(req, res, next) {
    makeRequest("get", metaUri, function(stResponse) {
      if(stResponse.ok) {
        baseUri = stResponse.body[0].uri;
        storage.save(null, baseUri);
      }
      
      next();
    });
  },
  //
  // Ensures that the installation base URL has been set.
  //
  ensureInitialized: function(req, res, next) {
    if(!baseUri) {
      res.status(401);
      res.send("URL for SmartThings installation has not been initialized.");
      return;
    }
    
    next();
  }
};
