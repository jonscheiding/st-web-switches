import bunyan from 'bunyan'
import expressBunyanLogger from 'express-bunyan-logger'

const config = {
  name: 'st-web-switches',
  level: process.env.LOG_LEVEL || 'info',
  src: true
}

export const expressLogger = () => {
  const options = {
    ...config,
    levelFn: (status) => {
      return (
        status >= 500 ? 'error' :
        status >= 400 ? 'warn' :
        'debug'
      )
    },
    includesFn: (req) => {
      return { user: req.user }
    }
  }
  
  return [
    expressBunyanLogger(options),
    expressBunyanLogger.errorLogger(options)
  ]
}

class BrowserConsoleStream {
  constructor() { 
    this.innerStream = new bunyan.ConsoleFormattedStream()
  }
  
  write(rec) {
    const { level, levelName, msg, name, src, time, v, ...properties } = rec
    
    return this.innerStream.write({
      level, levelName, msg, name, src, time, v,
      obj: { ...properties }
    })
  }
} 

if(process.env.WEBPACK) {
  config.streams = [{
    stream: new BrowserConsoleStream()
    // stream: {
    //   write: (data) => console.log(data)
    // }
  }]
}

export default bunyan.createLogger(config)