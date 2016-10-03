import express from 'express'

import api from './api'

const app = express()
app.use('/api', api)

export default {
  start: (port) => {
    app.listen(port)
  }
}