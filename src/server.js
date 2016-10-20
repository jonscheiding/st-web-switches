import express from 'express'

import api from './api'
import ui from './ui'

const app = express()

if(process.env.FNLLC) {
  const fnllc = require('src/fnllc').default
  app.use(fnllc())
}

app.use('/api', api(process.env))
app.use('/', ui(process.env))

export default {
  start: (port) => {
    app.listen(port)
  }
}