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

export default bunyan.createLogger({
  name: 'st-web-switches', // TODO: Can we infer a name based on the caller?
  level: process.env.LOG_LEVEL || 'info'
})
