# SmartThings Web Switches
SmartThings solution for remotely controlling smart switches via a web interface.

## SmartApp

The SmartApp is located in smartapps/jonscheiding/power-control and provides an API for accessing one or more smart switches.

### Installation and Authentication

Install the SmartApp by logging in to the SmartThings IDE and copy/pasting the code from this repository.  For detailed instructions, see [SmartApp / DeviceType :”From Code” and “From Template”](https://community.smartthings.com/t/smartapp-devicetype-from-code-and-from-template/11255).

To use the API directly, you'll need to get an OAuth token as described in the [SmartThings documentation](http://docs.smartthings.com/en/latest/smartapp-web-services-developers-guide/authorization.html).

### Features

The SmartApp has the following basic features:
1. Turn smart switches on and off via API
2. Provide power usage information via API for switches that have that capability
3. Turns switches off after a configurable timeout

### API
#### GET /info
Returns information about the SmartApp installation.  The **label** and **switch_timeout** fields are the values set by the user when they enabled the SmartApp.  The **state** field returns the SmartApp state for diagnostic purposes.
##### Example request
    GET https://graph.api.smartthings.com/api/smartapps/installations/GUID/info
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
    
#### TODO: Finish API documentation