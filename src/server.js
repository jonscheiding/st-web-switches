import express from 'express'

import api from './api'
import ui from './ui'

const app = express()

if(process.env.EXPRESS_AUTH) {
  const auth = require('src/auth/' + process.env.EXPRESS_AUTH).default
  app.use(auth())
}

app.use('/api', api)
app.use('/', ui)

export default {
  start: (port) => {
    app.listen(port)
  }
}