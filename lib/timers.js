var moment = require("moment");

var timeouts = {};
var granularity = moment.duration(1, "seconds");
var interval;

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
    console.log("Time's up for " + id + "!");
    delete timeouts[id];
  }
  
  if (Object.keys(timeouts).length == 0) {
    clearInterval(interval);
  }
}

module.exports.start = function(id, duration) {
  timeouts[id] = moment().add(duration);
  ensureInterval();
}