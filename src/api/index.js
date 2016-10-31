import bodyParser from 'body-parser'
import express from 'express'
import envalid from 'envalid'
import mimeInterceptor from 'rest/interceptor/mime'
import pathPrefixInterceptor from 'rest/interceptor/pathPrefix'

import { proxy, proxyInterceptor } from './express-rest-proxy'
import { accessTokenInterceptor, pathRewriteInterceptor, prefixLinksInterceptor, switchesInterceptor } from './interceptors'
import { default as logger, restLoggerInterceptor } from 'src/logger'

const UNPLUGGED_TIME_THRESHOLD = 5000

export default (config) => {
  config = envalid.validate(config, {
    SMARTAPP_ACCESS_TOKEN: { required: true },
    SMARTAPP_BASE_URL: { required: true }
  })
  
  const [ baseUrl, accessToken ] = [ config.SMARTAPP_BASE_URL, config.SMARTAPP_ACCESS_TOKEN ]
  
  const api = express.Router()
  api.use(bodyParser.json())
  
  api.use(
    proxyInterceptor(restLoggerInterceptor),
    proxyInterceptor(mimeInterceptor),
    proxyInterceptor(pathPrefixInterceptor, { prefix: baseUrl }),
    proxyInterceptor(accessTokenInterceptor, { accessToken })
  )
  
  api.use((req, res, next) => 
    proxyInterceptor(prefixLinksInterceptor, { prefix: req.baseUrl })(req, res, next)
  )

  api.get('/', proxyInterceptor(pathRewriteInterceptor, { path: '/app' }))
  api.use('/switches', proxyInterceptor(switchesInterceptor, { unpluggedTimeThreshold: UNPLUGGED_TIME_THRESHOLD }))
  
  api.post('/switches/:id/:state', (req, res, next) => {
    logger.info({user: req.user, id: req.params.id}, `Switch ${req.params.id} requested to turn ${req.params.state}.`)
    next()
  })
  
  api.post('/switches/:id/timer/:state', (req, res, next) => {
    logger.info({user: req.user, id: req.params.id}, `Switch ${req.params.id} requested to turn ${req.params.state} in ${req.query.after} minutes.`)
    next()
  })
  
  api.delete('/switches/:id/timer/:state', (req, res, next) => {
    logger.info({user: req.user, id: req.params.id}, `Timer to turn ${req.params.state} switch ${req.params.id} requested to cancel.`)
    next()
  })
  
  api.use(proxy())
  
  return api
}
