# SmartThings Web Switches
SmartThings solution for remotely controlling smart switches via a web interface.

[![Build Status](https://travis-ci.org/jonscheiding/st-web-switches.svg?branch=master)](https://travis-ci.org/jonscheiding/st-web-switches)

## Architecture
This solution consists of the following components:

 * A [SmartThings SmartApp](smartapps/jonscheiding/power-control) which provides an API to interact with switches controlled by SmartThings.
 * An [ExpressJS server application](src) which proxies the SmartThings API so that the OAuth2 authentication can be abstracted away from the user.
 * An [AngularJS web application](src/app) that provides the actual user interface.

## FNLLC
If run with an environment variable FNLLC=1, the app will authenticate with Schedule Master (used by FNLLC for airplane scheduling).  It does this through my other project, [schedulemaster-api](https://github.com/jonscheiding/schedulemaster-api).

## Installation
To set up, you need to install the SmartApp in a SmartThings environment.  The best way to do this is to install from GitHub.  General instructions can be found [here](http://docs.smartthings.com/en/latest/tools-and-ide/github-integration.html).  You can also install by copying and pasting the code directly into the SmartThings IDE, see instructions [here](http://docs.smartthings.com/en/latest/smartapp-web-services-developers-guide/authorization.html).

## Configuration
The app requires the following environment variables:

| Variable              | Description                                                                                   |
|-----------------------|-----------------------------------------------------------------------------------------------|
| SESSION_SECRET        | A secret key for Express sessions                                                             |
| SM\_OAUTH\_ID           | The client ID for the Schedule Master API                                                     |
| SM\_OAUTH\_SECRET       | The client secret for the Schedule Master API                                                 |
| SM\_API\_URL            | The URL for the Schedule Master API                                                           |
| SMARTAPP\_ACCESS\_TOKEN | An OAuth2 access token from SmartThings                                                       |
| SMARTAPP\_BASE\_URL     | The installation endpoint for the SmartThings Smartapp                                        |
| TIMER\_DEFAULT         | Optional time of day to default for timers in the application (Example: TIMER_DEFAULT=7:00AM) |
| LOGGLY\_TOKEN          | Optional token for logging to Loggly                                                          |
| LOGGLY\_SUBDOMAIN      | Subdomain for logging to Loggly, required if LOGGLY_TOKEN is provided                         |

The SmartThings access token and base URL must be obtained from SmartThings using Postman or a similar tool.  See [the documentation](http://docs.smartthings.com/en/latest/smartapp-web-services-developers-guide/authorization.html) for more information.

## Running
To run the web application:

    npm install
    npm start
    
To run it with the FNLLC authentication enabled:

    npm run start:fnllc
    
