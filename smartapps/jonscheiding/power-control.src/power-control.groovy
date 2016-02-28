/**
 *  Power Control
 *
 *  Copyright 2016 Jon Scheiding
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License. You may obtain a copy of the License at:
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed
 *  on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License
 *  for the specific language governing permissions and limitations under the License.
 *
 */
definition(
  name: "Power Control",
  namespace: "jonscheiding",
  author: "Jon Scheiding",
  description: "Enable control of one or more switches via an API.",
  category: "My Apps",
  iconUrl: "http://www.indianmagentoexperts.com/wp-content/uploads/2013/02/api-icon.png",
  iconX2Url: "http://www.indianmagentoexperts.com/wp-content/uploads/2013/02/api-icon.png",
  iconX3Url: "http://www.indianmagentoexperts.com/wp-content/uploads/2013/02/api-icon.png",
  oauth: true)

preferences {
  section("Allow external service to control these things...") {
    input "switches", "capability.switch", title: "Which switches should the API expose?", multiple: true, required: true
  }
  section (mobileOnly: true, "Turn off switches automatically...") {
    input "switch_timeout", "nunber", title: "After how many minutes?", required: true
  }
}

mappings {
  path("/info") {
    action: [
      GET: "api_info_get"
    ]
  }
  path("/timers") {
    action: [
      GET: "api_timers_get"
    ]
  }
  path("/timers/:id") {
    action: [
      GET: "api_timer_get",
      DELETE: "api_timer_delete"
    ]
  }
  path("/switches") {
    action: [
      GET: "api_switches_get"
    ]
  }
  path("/switches/:id") {
    action: [
      GET: "api_switch_get"
    ]
  }
  path("/switches/:id/:state") {
    action: [
      PUT: "api_switch_state_put"
    ]
  }
}

def api_info_get() {
  [
    label: app.label
  ]
}

def api_timers_get() {
  check_timers()
  
  state.timers.collect {[id: it.key, until: it.value]}
}

def api_timer_get() {
  def timer = state.timers[params.id]
  if(!timer) {
    logHttpError(404, "No timer set for ${params.id}.")
  }
  
  map_timer(params.id, timer)
}

def api_timer_delete() {
  if(!state.timers[params.id]) {
    logHttpError(404, "No timer set for ${params.id}.")
  }
  
  log.info("Received a request to unset the timer for ${params.id}, which was set for ${state.timers[params.id]}.")
  
  state.timers.remove(params.id)
}

def api_switches_get() {
  switches.collect {map_switch(it)}
}

def api_switch_get() {
  map_switch(find_switch(params.id))
}

def api_switch_state_put() {
  def sw = find_switch(params.id)
  
  log.info("Received request to turn switch ${sw.id} to ${params.state}.  Switch is currently ${sw.currentSwitch}.")
        
  switch(params.state) {
      case "on": 
        sw.on()
        break
      case "off":
        sw.off()
        break
      default:
        logHttpError(404, "No such state for switch: '${params.state}'")
    }
    
    map_switch(sw)
}

def map_switch(sw) {
  def res = [
    id: sw.id,
    label: sw.displayName,
    state: [
      is: sw.currentSwitch
    ]
  ]
  
  if(state.timers[sw.id]) {
    res.state.until = Date.parseToStringDate(state.timers[sw.id])
  }
  
  res
}

def map_timer(key, value) {
  [
    id: key,
    until: value
  ]
}

def find_switch(id) {
  def sw = switches.find { it.id == id }
  
  if(!sw) {
    logHttpError(404, "No such switch: '${id}'")
  }
  
  return sw  
}

def start_timer(id) {
  def cal = new GregorianCalendar()
  cal.setTime(new Date())
  cal.add(Calendar.MINUTE, switch_timeout.toInteger())
  
  state.timers[id] = cal.getTime().toString()  
  log.info("Setting timer to turn off switch ${id} at ${state.timers[id]}.")
  
  schedule("* * * * * ?", check_timers)
}

def check_timers() {
  def now = new Date()
  
  log.debug("Checking all timers ${state.timers}.")
  
  state.timers.each { id, time -> 
    if(now > Date.parseToStringDate(time)) {
      log.info("Turning off switch ${id}, since its time ran out at ${time}.")
      
      def sw = switches.find { it.id == id }
      if(!sw) {
        log.error("Switch ${id} does not exist.")
      }
      
      sw.off()
      state.timers.remove(id)
    }
  }
  
  if(!state.timers) {
    log.info("Stopping timer schedule because there are no active timers.")
    unschedule(check_timers)
  }
}

def logHttpError(code, msg) {
  log.error("${code} ${msg}");
  httpError(code, msg);
}

def handleSwitchOn(evt) {
  log.debug("Received notification that switch ${evt.device.id} turned on.")
  start_timer(evt.device.id)
}

def handleSwitchOff(evt) {
  log.debug("Received notification that switch ${evt.deviceId} turned off.")
  if(state.timers[evt.device.id]) {
    log.info("Unsetting timer for ${evt.deviceId} because it turned off.  Timer was set for ${state.timers[evt.device.id]}.")
    state.timers.remove(evt.device.id)
  }
}

def installed() {
  log.debug "Installed with settings: ${settings}"

  initialize()
}

def updated() {
  log.debug "Updated with settings: ${settings}"

  unsubscribe()
  initialize()
}

def initialize() {
  if(!state.timers) {
    state.timers = [:]
  }
  
  switches.each { 
    subscribe(it, "switch.on", handleSwitchOn)
    subscribe(it, "switch.off", handleSwitchOff)
  }
}
