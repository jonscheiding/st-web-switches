//
// Main application.  Primarily handles providing an ExpressJS interface to the
// logic in st-app and st-auth.
//

import express from 'express'
import winston from 'winston'
import expressWinston from 'express-winston'

import api from './api'
import ui from './ui'

var app = express.Router()
app.use(api())
app.use(ui())

app.use('/', expressWinston.logger({winstonInstance: winston}))

export default app