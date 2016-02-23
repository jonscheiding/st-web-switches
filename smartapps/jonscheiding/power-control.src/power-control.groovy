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
        
  switch(params.state) {
      case "on": 
        sw.on()
        break
      case "off":
        sw.off()
        break
      default:
        httpError(404, "No such state for switch: '" + params.state + "'")
    }
    
    api_switch_get
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
    httpError(404, "No such switch: '" + id + "'")
  }
  
  return sw  
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

def initialize() {}
