var winston = require("winston");

var storage = {};
var loadInternal, saveInternal;

loadInternal = function(done, key) {
  done(storage[key]);
};
saveInternal = function(done, key, value) {
  storage[key] = value;
  if(done) {done()};
};

module.exports = function(key) {
  return {
    load: function(done) {
      loadInternal(function(value) {
        if(value) {
          winston.info("Loaded value %j for key %s.", value, key);
          done(value);
        } else {
          winston.warn("No value found for key %s.", key);
          done();
        }
      }, key);
    },
    save: function(done, value) {
      winston.info("Storing value %j for key %s.", value, key);
      saveInternal(done, key, value);
    }
  }
}