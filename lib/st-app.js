var stAuth = require("./st-auth.js");
var unirest = require("unirest");

var baseUri = "https://graph.api.smartthings.com:443/api/smartapps/installations/a5c0a34f-3ee2-4928-8afe-eda9c15e4fd7";

function makeRequest(method, url, done) {
  unirest[method](baseUri + url)
    .headers({Authorization: stAuth.getAuthorization()})
    .end(done);
}

module.exports = {};
module.exports.passthrough = function(options) {
  return function(enrich) { 
    return function(req, res) {
      var method = req.method.toLowerCase();
      var url = req.originalUrl;
      if(options.transformUrl) {
        url = options.transformUrl(url);
      }
      
      makeRequest(method, url, function(response) {
        if(enrich) {
          enrich(response);
        }
        
        res.status(response.status);
        res.send(response.body);
      });
    }
  } 
}