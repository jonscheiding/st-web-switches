import express from 'express'
import bodyParser from 'body-parser'

import proxy from './smartapp-proxy'

const api = express.Router()

api.use(bodyParser.json())
api.use(proxy())

export default api