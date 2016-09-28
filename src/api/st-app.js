//
// Handles talking to SmartThings st-power-control API.  The goal of this module
// is to make it easy to use ExpressJS to create a "proxy" to the SmartThings
// backend.  Client applications can then talk to the proxy without having to
// worry about exposing an OAuth access token.
//

import unirest from 'unirest'
import merge from 'merge'
import moment from 'moment'
import util from 'util'
import winston from 'winston'

import stAuth from './st-auth'
import createStorage from './storage'

const storage = createStorage('smartapp_endpoint_uri')

//
// Minimum power usage to consider that something is "plugged in".  In Watts.
//
const powerThreshold = process.env.POWER_THRESHOLD || 0
//
// After turning on a switch, it takes a few seconds before SmartThings reflects
// power usage.  This grace period is used to avoid having the switch show a 
// warning during this time.
//
const powerGracePeriod = 4

const metaUri = 'https://graph.api.smartthings.com/api/smartapps/endpoints'
let baseUri

storage.load(function(value) {
  baseUri = value
})

//
// For requests to /switches or /switches/:id, check the power usage so we can
// return an "unplugged" warning.  The word "middleware" here has a similar
// meaning to how ExpressJS uses it.
//
const middlewares = [
  { url: /^\/switches\/?$/, method: function(stResponse) { stResponse.body.forEach(addUnpluggedField) } },
  { url: /^\/switches\/[^/]*$/, method: function(stResponse) { addUnpluggedField(stResponse.body) } }
]

function addUnpluggedField(sw) {
  if(sw.state.is != 'on' || typeof(sw.state.power) == 'undefined') {
    return
  }
  
  let timeOn = 0
  if(sw.state.since) {
    timeOn = moment().diff(moment(sw.state.since), 'seconds')
  }

  winston.debug('Switch %s has been on for %d seconds and is drawing %d W.', sw.id, timeOn, sw.state.power)
  
  if(timeOn <= powerGracePeriod) {
    sw.state.plug = 'unknown'
    return
  }
  
  sw.state.plug = (sw.state.power <= powerThreshold) ? 'unplugged' : 'plugged-in'
}

function findMiddlewareApplicableFor(url) {
  let foundMiddleware
  middlewares.forEach(function(middleware) {
    if(middleware.url.test(url)) {
      winston.info('Found middleware %s for %s.', util.inspect(middleware), url)
      foundMiddleware = middleware.method
    }
  })
  return foundMiddleware
}

function makeRequest(method, uri, done) {
  return unirest[method](uri)
    .headers({Authorization: 'Bearer ' + stAuth.getAccessToken()})
    .end(function(stResponse) {
      winston.info('SmartThings API %s %s %d %j', method.toUpperCase(), uri, stResponse.status, stResponse.body)
      
      if(done) {
        done(stResponse)
      }
    })
}

//
// Simple method to call an endpoint on the API.
//
const call = function(options, done) {
  const method = options.method.toLowerCase()
  const url = options.url
  
  makeRequest(method, baseUri + url, function(stResponse) {
    if(stResponse.ok) {
      const middlewareMethod = findMiddlewareApplicableFor(url)
      if(middlewareMethod) {
        middlewareMethod(stResponse)
      }
    }
    if(done) {
      done(stResponse)
    }
  })
}

//
// Method used to pass an ExpressJS request through to the SmartThings API,
// and return the API's response.  Basically "proxies" the SmartThings API to
// the browser.
//
const passthrough = function(options) {
  return function(req, res) {
    let fixupUrl = passthrough.fixupUrl || function(s) {return s}
    
    const finalOptions = merge(true, {
      method: req.method,
      url: fixupUrl(req.originalUrl)
    }, options)
    
    call(finalOptions, function(stResponse) {
      if(finalOptions.handleResponse) {
        const next = finalOptions.handleResponse(stResponse, req)
        if(next) {
          next(req, res)
          return
        }
      }
      
      res.status(stResponse.status)
      res.send(stResponse.body)
    })
  }
}

//
// Exports for integration into ExpressJS
//
const express = {
  //
  // Initialize call, goes out to SmartThings API to get the installation base
  // URL.
  //
  initialize: function(req, res, next) {
    baseUri = process.env.SMARTAPP_ENDPOINT_URI
    if(baseUri) {
      winston.info('Found value \'%s\' in environment for base URI.', baseUri)
      storage.save(next, baseUri)
      return
    }
    
    makeRequest('get', metaUri, function(stResponse) {
      if(stResponse.ok) {
        baseUri = stResponse.body[0].uri
        storage.save(next, baseUri)
      } else {
        next()
      }
    })
  },
  //
  // Ensures that the installation base URL has been set.
  //
  ensureInitialized: function(req, res, next) {
    if(!baseUri) {
      res.status(401)
      res.send('URL for SmartThings installation has not been initialized.')
      return
    }
    
    next()
  }
}

export default { passthrough, express, call }