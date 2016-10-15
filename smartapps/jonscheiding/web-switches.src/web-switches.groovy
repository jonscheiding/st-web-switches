/**
*  Web Switches
*
*  Copyright 2016 Jon Scheiding
*
*  Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
*  in compliance with the License. You may obtain a copy of the License at:
*
*	  http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed
*  on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License
*  for the specific language governing permissions and limitations under the License.
* 
*/

definition(
	name: "Web Switches",
	namespace: "jonscheiding",
	author: "Jon Scheiding",
	description: "Enable control of one or more switches via an API.",
	category: "My Apps",
	iconUrl: "http://cdn.device-icons.smartthings.com/Appliances/appliances17-icn.png",
	iconX2Url: "http://cdn.device-icons.smartthings.com/Appliances/appliances17-icn@2x.png",
	iconX3Url: "http://cdn.device-icons.smartthings.com/Appliances/appliances17-icn@2x.png",
	oauth: true)
	
preferences {
	section("Allow external service to control these things...") {
		input "switches", "capability.switch", title: "Which switches should the API expose?", multiple: true, required: true
	}
	section (mobileOnly: true, "Turn off switches automatically...") {
		input "timer_default", "number", title: "After how many minutes?", required: true, defaultValue: 120
	}
}

mappings {
	path("/app") {
		action: [ GET: "api_app_get" ]
	}
	path("/switches") {
		action: [ GET: "api_switches_get" ]
	}
	path("/switches/:id") {
		action: [ GET: "api_switch_get" ]
	}
	path("/switches/:id/:state") {
		action: [ POST: "api_switch_state_post" ]
	}
	path("/switches/:id/timer/:state") {
		action: [ 
			POST: "api_switch_timer_state_post",
			DELETE: "api_switch_timer_state_delete"
		]
	}
	path("/debug/check_timers") {
		action: [ POST: "check_timers" ]
	}
}

def api_app_get() {
	[ 
		label: app.label, 
		timerDefault: settings.timer_default,
		links: [
			"switches": "/switches"
		]
	]
}

def api_switches_get() {
	switches.collect { map_switch(it) }
}

def api_switch_get() {
	map_switch(find_switch(params.id))
}

def api_switch_state_post() {
	def sw = find_switch(params.id)

	turn_switch(sw, params.state)
	map_switch(sw)
}

def api_switch_timer_state_delete() {
	def sw = find_switch(params.id)
	def timer = state.switches[sw.id].timer
	if(timer == null) log_http_error(400, "There is no timer for switch ${sw.id}.")
	if(timer.turn != params.state) log_http_error(400, "There is no timer to turn ${params.state} switch ${sw.id}.")
	
	clear_timer(sw)
}

def api_switch_timer_state_post() {
	def sw = find_switch(params.id)
	
	def currentSwitch = state.switches[sw.id].currently ?: sw.currentSwitch
	
	switch (currentSwitch) {
		case params.state:
		case "turning " + params.state:
			httpError(400, "Cannot set timer to turn switch ${params.state} because it is already ${currentSwitch}.")
	}

	start_timer(sw, params.state, true, params.after)

	map_switch(sw)
}

def map_switch(sw) {
	//
	// Update the state "manually" to work around issue where the switch has 
	// changed state, but the event handler apparently never fired.
	//
	update_currently_value(sw)

	def sw_state = state.switches[sw.id]
	
	def currentSwitch = (sw_state.currently ?: sw.currentSwitch)
	def currentPower = null
	if(can_report_current_power(sw) && currentSwitch == "on") {
		currentPower = sw.currentPower ?: 0
	}
	
	[
		id: sw.id,
		label: sw.displayName,
		state: [
			currently: currentSwitch,
			since: sw_state.since
		],
		timer: sw_state.timer,
		usage: currentPower,
		links: [
			self: "/switches/${sw.id}",
			"on": "/switches/${sw.id}/on",
			"off": "/switches/${sw.id}/off",
			"timer/on": "/switches/${sw.id}/timer/on",
			"timer/off": "/switches/${sw.id}/timer/off"
		]
	]
}

def find_switch(id) {
	def sw = switches.find { it.id == id }
	
	if(!sw) {
		log_http_error(404, "No such switch: '${id}'")
	}
	
	return sw
}

def start_timer(sw, desired_state, override = false, minutes_from_now = null) {
	def sw_timer = state.switches[sw.id].timer

	if(sw_timer != null) {
		if(sw_timer.turn == desired_state && !override) {
			log.info("Not starting a timer to turn ${desired_state} switch ${sw.id}, because there is one already.")
			return
		} else if(sw_timer.turn != null) {
			log.warn("Setting a timer to turn ${desired_state} switch ${sw.id}, even though there is already on to turn it ${sw_timer.turn}.")
		}
	}
	
	sw_timer = [:]
	state.switches[sw.id].timer = sw_timer
	
	minutes_from_now = minutes_from_now ?: timer_default

	def cal = new GregorianCalendar()
	cal.setTime(new Date())
	cal.add(Calendar.MINUTE, minutes_from_now.toInteger())
	
	sw_timer.turn = desired_state
	sw_timer.at = cal.getTime().toString()
	
	log.info("Setting timer for switch ${sw.id}: ${sw_timer}")
	
	schedule("* * * * * ?", check_timers)
}

def clear_timer(sw) {
	if(state.switches[sw.id].timer == null) return
	
	log.info("Unsetting timer for ${sw.id}.  Timer was set for ${state.switches[sw.id].timer.at}.")
	state.switches[sw.id].timer = null
}

def check_timers() {
	def now = new Date()
	def remove = []
	
	log.debug("Checking all timers ${state.switches}.")
	def timers_remaining = 0
	
	switches.each { sw ->
		def sw_timer = state.switches[sw.id].timer
		if(sw_timer == null) return
		
		if(now < Date.parseToStringDate(sw_timer.at)) {
			timers_remaining ++
			return
		}
		
		log.info("Turning ${sw_timer.turn} switch ${sw.id}, since its timer went off at ${sw_timer.at}.")
		switch(sw_timer.turn) {
			case "off": sw.off(); break
			case "on": sw.on(); break
		}
		update_currently_value("turning ${sw_timer.turn}")
		state.switches[sw.id].timer = null
	}
	
	if(timers_remaining == 0) {
		log.info("Stopping timer schedule because there are no active timers.")
		unschedule(check_timers)
	}
	
	state
}

def turn_switch(sw, turn) {
	if(sw.currentSwitch == turn) return

	update_currently_value(sw, "turning ${turn}")
	
	switch(turn) {
		case "on":
			sw.on()
			start_timer(sw, "off")
			break
		case "off":
			sw.off()
			clear_timer(sw)
			break
		default:
			log_http_error(400, "Invalid value '${state}' in POST data field '.turn'")
	}
}

def update_currently_value(sw, value = sw.currentSwitch) {
	def sw_state = state.switches[sw.id]
	if(sw_state.currently == value) return

	log.debug("Updating state value for switch ${sw.id} from '${sw_state.currently}' to '${value}'.")

	sw_state.currently = value
	sw_state.since = new Date().toString()
}

def can_report_current_power(sw) {
	sw.supportedAttributes.any{ it.name == "power" }
}

def log_http_error(code, msg) {
	log.error("${code} ${msg}");
	httpError(code, msg);
}

def handle_switch_on(evt) { return
	log.debug("Received notification that switch ${evt.device.id} turned on.")
	update_currently_value(evt.device)
	start_timer(evt.device, "off")
}

def handle_switch_off(evt) {
	log.debug("Received notification that switch ${evt.deviceId} turned off.")
	update_currently_value(evt.device)
	clear_timer(evt.device)
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
	state.switches = state.switches ?: [:]
	def updatedState = [:]
	
	switches.each { sw -> 
		subscribe(sw, "switch.on", handle_switch_on)
		subscribe(sw, "switch.off", handle_switch_off)
		updatedState[sw.id] = state.switches[sw.id] ?: [:]
	}

	state.switches = updatedState
	
	log.info "state: ${state} | settings: ${settings}"
}
