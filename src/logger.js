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

let logger

if(process.env.WEBPACK) {
  logger = bunyan.createLogger({
    name: 'st-web-switches',
    level: process.env.LOG_LEVEL || 'info',
    streams: [{
      level: 'debug',
      stream: new bunyan.ConsoleFormattedStream()
      // stream: {
      //   write: (data) => console.log(data)
      // }
    }],
    src: true
  })
} else {
  logger = bunyan.createLogger({
    name: 'st-web-switches', // TODO: Can we infer a name based on the caller?
    level: process.env.LOG_LEVEL || 'info'
  })
}

export default logger