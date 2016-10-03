import envalid from 'envalid'
import rest from 'rest'
import interceptor from 'rest/interceptor'
import mimeInterceptor from 'rest/interceptor/mime'
import pathPrefixInterceptor from 'rest/interceptor/pathPrefix'

import proxy from 'src2/rest-proxy'

envalid.validate(process.env, {
  SMARTAPP_ACCESS_TOKEN: { required: true },
  SMARTAPP_BASE_URL: { required: true }
})

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
  let [ baseUrl, accessToken ] = [ process.env.SMARTAPP_BASE_URL, process.env.SMARTAPP_ACCESS_TOKEN ]
  let proxyRequest = proxy(client
    .wrap(pathPrefixInterceptor, {prefix: baseUrl})
    .wrap(accessTokenInterceptor, {accessToken: accessToken}))
    
  proxyRequest(req, res)
}

