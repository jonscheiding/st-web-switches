import bunyan from 'bunyan'
import expressBunyanLogger from 'express-bunyan-logger'

export const expressLogger = () => {
  const options = {
    levelFn: (status) => {
      return (
        status >= 500 ? 'error' :
        status >= 400 ? 'warn' :
        'debug'
      )
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

const config = {
  name: 'st-web-switches',
  level: process.env.LOG_LEVEL || 'info',
  src: true
}

if(process.env.WEBPACK) {
  config.streams = [{
    level: 'debug',
    stream: new BrowserConsoleStream()
    // stream: {
    //   write: (data) => console.log(data)
    // }
  }]
}

export default bunyan.createLogger(config)