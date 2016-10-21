import express from 'express'

import api from './api'
import ui from './ui'
import { expressLogger } from './logger'
import logger from './logger'

const app = express()
app.use(expressLogger())

if(process.env.FNLLC) {
  const fnllc = require('src/fnllc').default
  app.use(fnllc())
}

app.use('/api', api(process.env))
app.use('/', ui(process.env))

export default {
  start: (port) => {
    app.listen(port)
    logger.info({port}, 'Server started successfully.')
  }
}