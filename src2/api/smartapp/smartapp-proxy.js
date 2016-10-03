import rest from 'rest'
import interceptor from 'rest/interceptor'
import mimeInterceptor from 'rest/interceptor/mime'
import pathPrefixInterceptor from 'rest/interceptor/pathPrefix'

import db from 'redis-db'
import proxy from 'rest-proxy'

const accessTokenInterceptor = interceptor({
  request: (request, options) => {
    if(!options.accessToken) return
    
    return {
      ...request,
      headers: {
        Authorization: 'Bearer ' + options.accessToken,
        ...request.headers
      }
    }
  }
})

const client = rest.wrap(mimeInterceptor)

export default () => (req, res) => {
  db.mget('smartapp-base-url', 'smartapp-access-token', (err, replies) => {
    let [ baseUrl, accessToken ] = replies
    let proxyRequest = proxy(client
      .wrap(pathPrefixInterceptor, {prefix: baseUrl})
      .wrap(accessTokenInterceptor, {accessToken: accessToken}))
      
    proxyRequest(req, res)
  })
}

