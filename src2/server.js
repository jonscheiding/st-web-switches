import express from 'express'

import api from './api'
import ui from './ui'

const app = express()
app.use('/api', api)
app.use('/', ui)

export default {
  start: (port) => {
    app.listen(port)
  }
}