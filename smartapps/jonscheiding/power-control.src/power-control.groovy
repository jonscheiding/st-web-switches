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
  description: "SmartApp to enable control of one or more switches via an API.",
  category: "My Apps",
  iconUrl: "https://s3.amazonaws.com/smartapp-icons/Convenience/Cat-Convenience.png",
  iconX2Url: "https://s3.amazonaws.com/smartapp-icons/Convenience/Cat-Convenience@2x.png",
  iconX3Url: "https://s3.amazonaws.com/smartapp-icons/Convenience/Cat-Convenience@2x.png",
  oauth: true)

preferences {
  input "switches", "capability.switch", title: "Control these switches", multiple: true
}

mappings {
  path("/info") {
    action: [
      GET: "api_info_get"
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
  if(!state.timers) {
    state.timers = [:]
  }
  
  check_timers()
  
  [
    label: app.label
  ]
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
        start_timer(sw.id)
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
  [
    id: sw.id,
    label: sw.displayName,
    state: sw.currentSwitch
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
  cal.add(Calendar.SECOND, 10)
  
  state.timers[id] = cal.getTime().toString()  
  log.info("Setting timer to turn off switch ${id} at ${state.timers[id]}.")
  
  schedule("* * * * * ?", check_timers)
}

def check_timers() {
  def now = new Date()
  
  log.debug("Checking all timers ${state.timers}.")
  
  state.timers.each { id, time -> 
    log.debug("Checking timer for ${id}, set to expire at ${time}")
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
  state.timers = [:]
}
