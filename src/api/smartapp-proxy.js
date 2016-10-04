import envalid from 'envalid'
import rest from 'rest'
import interceptor from 'rest/interceptor'
import mimeInterceptor from 'rest/interceptor/mime'
import pathPrefixInterceptor from 'rest/interceptor/pathPrefix'
import mapObject from 'object.map'

import proxy from 'src/rest-proxy'

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

const linkRewriteInterceptor = interceptor({
  response: (response, options) => {
    if(!response.entity) return response
    if(!options.prefix) return response
    
    const rewriteLinks = links =>
      mapObject(links, (value) => 
        options.prefix + value)
    
    if(response.entity instanceof Array) {
      for(let entity of response.entity) {
        if(!entity.links) continue
        entity.links = rewriteLinks(entity.links)
      }
      
      return response
    }
    
    if(!response.entity.links) return response
    response.entity.links = rewriteLinks(response.entity.links)
    
    return response
  }
})

const urlRewriteInterceptor = interceptor({
  request: (request) => {
    switch(request.path) {
      case '/': 
        request.path = '/app'
    }
    
    return request
  }
})

const client = rest.wrap(mimeInterceptor)

export default () => (req, res) => {
  const [ baseUrl, accessToken ] = [ process.env.SMARTAPP_BASE_URL, process.env.SMARTAPP_ACCESS_TOKEN ]

  const proxyRequest = proxy(client
    .wrap(pathPrefixInterceptor, {prefix: baseUrl})
    .wrap(urlRewriteInterceptor)
    .wrap(accessTokenInterceptor, {accessToken: accessToken})
    .wrap(linkRewriteInterceptor, {prefix: req.baseUrl})
  )
  
  proxyRequest(req, res)
}

