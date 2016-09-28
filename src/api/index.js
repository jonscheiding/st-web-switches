import express from 'express'

import stAuth from './st-auth'
import stApp from './st-app'

stApp.passthrough.fixupUrl = function(s) {
  return s.replace(/^\/api/, '')
}

function addSwitchLinks(sw) {
  sw.links = {
    self: '/api/switches/' + sw.id,
    on: '/api/switches/' + sw.id + '/on',
    off: '/api/switches/' + sw.id + '/off'
  }
}

//
// Set up the authorization routes
//
stAuth.express.callbackUrl = '/authorize/callback'

export default () => {
  const api = express.Router()

  api.get('/authorize', stAuth.express.authorizeRedirect)
  api.get('/authorize/callback', stAuth.express.authorizeCallback, stApp.express.initialize, function(req, res) {  
    res.redirect('/')
  })

//
// Set up the actual API calls
//
  api.use('/api', stAuth.express.requireAuthorization, stApp.express.ensureInitialized)

  api.get('/api', function(req, res) {
    stApp.call({method: 'GET', url: '/info'}, function(stResponse) {
      stResponse.body.links = {
        self: '/api',
        switches: '/api/switches'
      }
      res.send(stResponse.body)
    })
  })

  api.get('/api/switches', stApp.passthrough({
    handleResponse: function(stResponse) {
      if(!stResponse.ok) return
      stResponse.body.forEach(addSwitchLinks)    
    }
  }))

  api.get('/api/switches/:id', stApp.passthrough({
    handleResponse: function(stResponse) {
      if(!stResponse.ok) return
      addSwitchLinks(stResponse.body)
    }
  }))

  api.put('/api/switches/:id/:state', stApp.passthrough({
    handleResponse: function(stResponse) {
      if(!stResponse.ok) return
    
      return function(req, res) {
        res.redirect(303, '/api/switches/' + req.params.id)
      }
    }
  }))

  return api
}