import bodyParser from 'body-parser'
import express from 'express'
import envalid from 'envalid'
import mimeInterceptor from 'rest/interceptor/mime'
import pathPrefixInterceptor from 'rest/interceptor/pathPrefix'

import { proxy, proxyInterceptor } from './express-rest-proxy'
import { accessTokenInterceptor, pathRewriteInterceptor, prefixLinksInterceptor, switchesInterceptor } from './interceptors'
import { default as logger, restLoggerInterceptor } from 'src/logger'

const logRequestMiddleware = (reqFn) => (req, res, next) => {
  reqFn(req)
  next()
}

const UNPLUGGED_TIME_THRESHOLD = 5000

export default (config) => {
  config = envalid.validate(config, {
    SMARTAPP_ACCESS_TOKEN: { required: true },
    SMARTAPP_BASE_URL: { required: true }
  })
  
  const [ baseUrl, accessToken ] = [ config.SMARTAPP_BASE_URL, config.SMARTAPP_ACCESS_TOKEN ]
  
  const api = express.Router()
  api.use(bodyParser.json())

  //
  // Set up some logging for specific endpoints
  //
  api.post('/switches/:id/:state', logRequestMiddleware(req => 
    logger.info({user: req.user, id: req.params.id}, `Switch ${req.params.id} requested to turn ${req.params.state}.`)))
  
  api.post('/switches/:id/timer/:state', logRequestMiddleware(req => 
    logger.info({user: req.user, id: req.params.id}, `Switch ${req.params.id} requested to turn ${req.params.state} in ${req.query.after} minutes.`)))
  
  api.delete('/switches/:id/timer/:state', logRequestMiddleware(req =>
    logger.info({user: req.user, id: req.params.id}, `Timer to turn ${req.params.state} switch ${req.params.id} requested to cancel.`)))
  
  //
  // Set up basic interceptors that should be used for all requests to the ST API
  //
  api.use(
    // Log all request/response to the proxied ST API
    proxyInterceptor(restLoggerInterceptor),
    // Handle content-type headers (specifically application/json)
    proxyInterceptor(mimeInterceptor),
    // Provide the ST API base URL for prefixing paths
    proxyInterceptor(pathPrefixInterceptor, { prefix: baseUrl }),
    // Add the access token to all proxied ST API calls
    proxyInterceptor(accessTokenInterceptor, { accessToken }),
    // Go through 'links' properties on all responses and fix the URLs so they
    // work with our proxy
    (req, res, next) => 
      proxyInterceptor(prefixLinksInterceptor, { prefix: req.baseUrl })(req, res, next)
  )

  //
  // Rewrite / to <st api>/app
  api.get('/', proxyInterceptor(pathRewriteInterceptor, { path: '/app' }))
  // Add some info to the /switches resource derived from the data that the API provides
  api.use('/switches', proxyInterceptor(switchesInterceptor, { 
    unpluggedTimeThreshold: UNPLUGGED_TIME_THRESHOLD,
    unpluggedUsageThreshold: config.UNPLUGGED_USAGE_THRESHOLD
  }))
  
  // Finally set up that we are going to satisfy all requests using a REST proxy
  api.use(proxy())
  
  return api
}
