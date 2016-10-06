# SmartThings Web Switches
SmartThings solution for remotely controlling smart switches via a web interface.

## SmartApp

  The SmartApp is located in [smartapps/jonscheiding/power-control](smartapps/jonscheiding/power-control) and provides an API for accessing one or more smart switches.

### Installation and Authentication

Install the SmartApp by logging in to the SmartThings IDE and copy/pasting the code from this repository.  For detailed instructions, see [SmartApp / DeviceType :”From Code” and “From Template”](https://community.smartthings.com/t/smartapp-devicetype-from-code-and-from-template/11255).

To use the API directly, you'll need to get an OAuth token as described in the [SmartThings documentation](http://docs.smartthings.com/en/latest/smartapp-web-services-developers-guide/authorization.html).

### Features

The SmartApp has the following basic features:

* Turn smart switches on and off via API
* Provide power usage information via API for switches that have that capability
* Turns switches off after a configurable timeout

### API
#### GET /app
Returns information about the SmartApp installation.  The **label** and **timerDefault** fields are the values set by the user when they enabled the SmartApp.
##### Example request
    GET https://.../app
##### Example response
    {
      "label": "My Power Control App",
      "timerDefault": "120",
      "links": {
        "switches": "/switches"
      }
    }
    
#### GET /switches
Returns information about the available switches.  Includes the switch label, GUID, and the current state (on/off, when it was turned on, and when it will turn off).
##### Example request
    GET https://.../switches
##### Example response
    [
      {
        "id": "0f67f4d7-1d6e-4a3e-bf83-49d3968c748e",
        "label": "Switch #1",
        "state": {
          "currently": "on|turning on|turning off",
          "since": "2016-06-15T17:24:09Z",
          "usage": 20
        },
        "timer": {
          "turn": "off",
          "at": "2016-06-15T19:24:09Z"
        },
        "links": {
          "self": "/switches/0f67f4d7-1d6e-4a3e-bf83-49d3968c748e",
          "off": "/switches/0f67f4d7-1d6e-4a3e-bf83-49d3968c748e/off"
        }
      },
      {
        "id": "fc069725-8e23-46b9-acf7-dac985ca8428",
        "label": "Switch #2",
        "state": {
          "currently": "off"
        },
        "links": {
          "self": "/switches/fc069725-8e23-46b9-acf7-dac985ca8428",
          "on": "/switches/fc069725-8e23-46b9-acf7-dac985ca8428/on"
        }
      },
      {
        "id": "bdeb5985-ab49-4d24-95ac-65d770546181",
        "label": "Switch #3",
        "state": {
          "currently": "off"
        },
        "timer": {
          "turn": "on",
          "at": "2016-06-15T19:24:09Z"
        },
        "links": {
          "self": "/switches/bdeb5985-ab49-4d24-95ac-65d770546181",
          "on": "/switches/bdeb5985-ab49-4d24-95ac-65d770546181/on"
        }
      }
    ]
 
#### GET /switches/:guid 
Returns information about a single switch.  Includes the switch label, ID, and the current state (on/off, when it was turned on, and when it will turn off).
##### Example request
    GET https://.../switches/0f67f4d7-1d6e-4a3e-bf83-49d3968c748e
    
#### POST /switches/:guid/:state
Turns a switch on or off.  Returns an HTTP 201 with the switch resource content.
##### Example request
    POST https://.../switches/0f67f4d7-1d6e-4a3e-bf83-49d3968c748e/on

#### POST /switches/:guid/timer/:state
Sets a switch to turn on or off at `after` seconds from now.  If `after` is not specified, uses the `timerDefault` value from the Smartapp settings.  Returns an HTTP 201 with the switch resource content.  If the switch is already in the desired state, returns an HTTP 400 error.
##### Example request
    POST https://.../switches/0f67f4d7-1d6e-4a3e-bf83-49d3968c748e/timer/on
    {
      "after": "3600"
    }
    
#### DELETE /switches/:guid/timer
Deletes an existing timer.  The switch will remain in its current state indefinitely.  Returns an HTTP 204 with no content.
##### Example request
    DELETE https://.../switches/0f67f4d7-1d6e-4a3e-bf83-49d3968c748e/timer
   
