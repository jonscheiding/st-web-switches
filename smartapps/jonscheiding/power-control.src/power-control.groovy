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
	path("/switches") {
    	action: [
        	GET: "listSwitches"
        ]
    }
    path("/switches/:id/:state") {
    	action: [
        	PUT: "updateSwitchState"
        ]
    }
}

def listSwitches() {
	switches.collect {
    	[id: it.id, label: it.displayName, state: it.currentSwitch]
    }
}

def updateSwitchState() {
	def sw = switches.find { it.id == params.id }
    
    switch(params.state) {
	    case "on": 
        	sw.on()
            break
        case "off":
        	sw.off()
            break
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
	// TODO: subscribe to attributes, devices, locations, etc.
}

// TODO: implement event handlers