var moment = require("moment");
var events = require("events");

var timeouts = {};
var granularity = moment.duration(1, "seconds");
var interval;

module.exports = new events.EventEmitter();
module.exports.start = function(id, duration) {
  timeouts[id] = moment().add(duration);
  ensureInterval();
};


function ensureInterval() {
  if(interval) return;
  interval = setInterval(checkTimeouts, granularity.asMilliseconds());
}

function checkTimeouts() {
  var now = moment();
  for(var id in timeouts) {
    if(timeouts[id] > now) {
      continue;
    }
    
    module.exports.emit("timesUp", id);
    
    delete timeouts[id];
  }
  
  if (Object.keys(timeouts).length == 0) {
    clearInterval(interval);
  }
}