import express from 'express'
import path from 'path'

import webpacked from './webpacked'

const webroot = path.resolve(__dirname, 'static')
const options = {
  index: 'index.html'
}

export default () => {
  const ui = express.Router()

  ui.use('/', express.static(webroot, options))
  ui.use('/', webpacked())
  
  return ui
}