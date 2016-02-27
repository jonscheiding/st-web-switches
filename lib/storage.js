var winston = require("winston");

var storage = {};
var loadInternal, saveInternal;

if(process.env.REDIS_URL) {

  var redis = require("redis");
  var client = redis.createClient(process.env.REDIS_URL);
  
  loadInternal = function(done, key) {
    client.get(key, function(err, reply) {
      if(err) {
        winston.error(err);
        done();
        return;
      }

      winston.info("Redis loaded key %s with value %s.", key, reply);

      try {
        done(JSON.parse(reply));
      } catch(e) {
        winston.error(e);
        done();
        return;
      }
    });
  };
  
  saveInternal = function(done, key, value) {
    value = JSON.stringify(value);
    winston.info("Redis storing key %s with value %s.", key, value);
    client.set(key, value);
    done();
  };

} else {

  loadInternal = function(done, key) {
    done(storage[key]);
  };
  saveInternal = function(done, key, value) {
    storage[key] = value;
    if(done) {done()};
  };

}

module.exports = function(key) {
  return {
    load: function(done) {
      loadInternal(function(value) {
        if(value) {
          winston.debug("Loaded value %j for key %s.", value, key);
          done(value);
        } else {
          winston.warn("No value found for key %s.", key);
          done();
        }
      }, key);
    },
    save: function(done, value) {
      winston.debug("Storing value %j for key %s.", value, key);
      saveInternal(done || function(){}, key, value);
    }
  }
}