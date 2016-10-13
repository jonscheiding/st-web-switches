import express from 'express'
import bodyParser from 'body-parser'

import proxy from './smartapp-proxy'

export default (config) => {
  const api = express.Router()
  api.use(bodyParser.json())

  api.use(proxy(config))

  return api
}