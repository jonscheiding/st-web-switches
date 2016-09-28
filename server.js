//
// Main application.  Primarily handles providing an ExpressJS interface to the
// logic in st-app and st-auth.
//

import express from 'express'
import path from 'path'
import winston from 'winston'
import expressWinston from 'express-winston'

import stAuth from './lib/st-auth'
import stApp from './lib/st-app'

stApp.passthrough.fixupUrl = function(s) {
  return s.replace(/^\/api/, '')
}

var app = express.Router()

function addSwitchLinks(sw) {
  sw.links = {
    self: '/api/switches/' + sw.id,
    on: '/api/switches/' + sw.id + '/on',
    off: '/api/switches/' + sw.id + '/off'
  }
}

//
// Set up logging of requests and serving of static content
//
var webroot = path.join(__dirname, 'htdocs')
var options = {
  index: 'index.html'
}

app.use('/', express.static(webroot, options))
app.use('/', expressWinston.logger({winstonInstance: winston}))

//
// Set up the authorization routes
//
stAuth.express.callbackUrl = '/authorize/callback'

app.get('/authorize', stAuth.express.authorizeRedirect)
app.get('/authorize/callback', stAuth.express.authorizeCallback, stApp.express.initialize, function(req, res) {  
  res.redirect('/')
})

//
// Set up the actual API calls
//
app.use('/api', stAuth.express.requireAuthorization, stApp.express.ensureInitialized)

app.get('/api', function(req, res) {
  stApp.call({method: 'GET', url: '/info'}, function(stResponse) {
    stResponse.body.links = {
      self: '/api',
      switches: '/api/switches'
    }
    res.send(stResponse.body)
  })
})

app.get('/api/switches', stApp.passthrough({
  handleResponse: function(stResponse) {
    if(!stResponse.ok) return
    stResponse.body.forEach(addSwitchLinks)    
  }
}))

app.get('/api/switches/:id', stApp.passthrough({
  handleResponse: function(stResponse) {
    if(!stResponse.ok) return
    addSwitchLinks(stResponse.body)
  }
}))

app.put('/api/switches/:id/:state', stApp.passthrough({
  handleResponse: function(stResponse) {
    if(!stResponse.ok) return
    
    return function(req, res) {
      res.redirect(303, '/api/switches/' + req.params.id)
    }
  }
}))

export default app