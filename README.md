# SmartThings Web Switches
SmartThings solution for remotely controlling smart switches via a web interface.

## SmartApp

The SmartApp is located in smartapps/jonscheiding/power-control and provides an API for accessing one or more smart switches.

### Installation and Authentication

Install the SmartApp by logging in to the SmartThings IDE and copy/pasting the code from this repository.  For detailed instructions, see [SmartApp / DeviceType :”From Code” and “From Template”](https://community.smartthings.com/t/smartapp-devicetype-from-code-and-from-template/11255).

To use the API directly, you'll need to get an OAuth token as described in the [SmartThings documentation](http://docs.smartthings.com/en/latest/smartapp-web-services-developers-guide/authorization.html).

### Features

The SmartApp has the following basic features:

* Turn smart switches on and off via API
* Provide power usage information via API for switches that have that capability
* Turns switches off after a configurable timeout

### API
#### GET /info
Returns information about the SmartApp installation.  The **label** and **switch_timeout** fields are the values set by the user when they enabled the SmartApp.  The **state** field returns the SmartApp state for diagnostic purposes.
##### Example request
    GET https://graph.api.smartthings.com/api/.../info
##### Example response
    {
      "label": "My Power Control App",
      "state": {
        "timers": {
          "0f67f4d7-1d6e-4a3e-bf83-49d3968c748e": {
            "start": "Tue Jun 14 14:12:27 UTC 2016",
            "end": "Tue Jun 14 16:12:27 UTC 2016"
          }
        },
        "switch_timeout": "120"
      }
    }
    
#### GET /switches
Returns information about the available switches.  Includes the switch label, GUID, and the current state (on/off, when it was turned on, and when it will turn off).
##### Example request
    GET https://graph.api.smartthings.com/api/.../switches
##### Example response
	[
	  {
	    "id": "0f67f4d7-1d6e-4a3e-bf83-49d3968c748e",
	    "label": "Switch #1",
	    "state": {
	      "is": "on",
	      "since": "2016-06-15T17:24:09Z",
	      "until": "2016-06-15T19:24:09Z"
	    }
	  },
	  {
	    "id": "fc069725-8e23-46b9-acf7-dac985ca8428",
	    "label": "Switch #2",
	    "state": {
	      "is": "off"
	    }
	  }
	]
 
#### GET /switches/:guid 
Returns information about a single switch.  Includes the switch label, ID, and the current state (on/off, when it was turned on, and when it will turn off).
##### Example request
    GET https://graph.api.smartthings.com/api/.../switches/0f67f4d7-1d6e-4a3e-bf83-49d3968c748e
##### Example response
	{
	   "id": "0f67f4d7-1d6e-4a3e-bf83-49d3968c748e",
	   "label": "Backyard Flood Light Switch",
	   "state": {
	     "is": "on",
	     "since": "2016-06-15T17:24:09Z",
	     "until": "2016-06-15T19:24:09Z"
	   }
	}
	
#### PUT /switches/:guid/on
Turns a switch on.  Returns an HTTP 204 with no content.
##### Example request
    PUT https://graph.api.smartthings.com/api/.../switches/0f67f4d7-1d6e-4a3e-bf83-49d3968c748e/on

#### PUT /switches/:guid/off
Turns a switch off.  Returns an HTTP 204 with no content.
##### Example request
    PUT https://graph.api.smartthings.com/api/.../switches/0f67f4d7-1d6e-4a3e-bf83-49d3968c748e/off

#### GET /timers
Returns information about any active timers, including the ID (which is the same as the switch ID), time turned on, and time turning off.
##### Example request
    GET https://graph.api.smartthings.com/api/.../timers
##### Example response
	[
	  {
	    "id": "0f67f4d7-1d6e-4a3e-bf83-49d3968c748e",
	    "until": {
	      "start": "Wed Jun 15 17:26:29 UTC 2016",
	      "end": "Wed Jun 15 19:26:29 UTC 2016"
	    }
	  }
	]


#### GET /timers/:guid
Returns information about an active timer, including the ID (which is the same as the switch ID), time turned on, and time turning off.
##### Example request
    GET https://graph.api.smartthings.com/api/.../timers/0f67f4d7-1d6e-4a3e-bf83-49d3968c748e
##### Example response
	{
	  "id": "0f67f4d7-1d6e-4a3e-bf83-49d3968c748e",
	  "until": {
	    "start": "Wed Jun 15 17:26:29 UTC 2016",
	    "end": "Wed Jun 15 19:26:29 UTC 2016"
	  }
	}
	
#### DELETE /timers/:guid
Deletes an existing timer.  This does not change the switch state; it just stops the timer so that the switch will not automatically turn off.  Returns an HTTP 204 with no content.
##### Example request
    DELETE https://graph.api.smartthings.com/api/.../timers/0f67f4d7-1d6e-4a3e-bf83-49d3968c748e
   