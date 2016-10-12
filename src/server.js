import express from 'express'

import api from './api'
import ui from './ui'

const app = express()

if(process.env.TENANT) {
  const tenant = require('src/tenant/' + process.env.TENANT).default
  app.use(tenant())
}

app.use('/api', api)
app.use('/', ui)

export default {
  start: (port) => {
    app.listen(port)
  }
}