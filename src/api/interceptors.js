import interceptor from 'rest/interceptor'
import mapObject from 'object.map'
import url from 'url'

//
// REST interceptor that puts a provided access token into an Authorization
// header on all requests
//
export const accessTokenInterceptor = interceptor({
  request: (request, config) => {
    if(!request.accessToken && !config.accessToken) return request
    
    const { accessToken, ...restOfRequest } = request
    
    return {
      ...restOfRequest,
      headers: {
        Authorization: `Bearer ${accessToken || config.accessToken}`,
        ...restOfRequest.headers
      }
    }
  }
})

//
// REST interceptor that changes paths for a request, either to a static path
// or using a rewritePath method
//
export const pathRewriteInterceptor = interceptor({
  request: (request, config) => {
    if(!config) return request
    
    const rewritePath = config.rewritePath || (path => config.path || path)
    
    const u = url.parse(request.path)
    u.path = u.pathname = rewritePath(u.path)
    
    return {
      ...request,
      path: u.format()
    }
  }
})

//
// REST interceptor that searches through response entity bodies for properties
// named 'links', and rewrites the value of each URL in the 'links' object
// using a specified prefix
//
export const prefixLinksInterceptor = interceptor({
  response: (response, config) => {
    if(!config.prefix) return response
    
    const prefixLink = (link) => {
      if(typeof(link) !== 'string') return link
      
      return config.prefix + link
    }
    
    const prefixLinks = (obj) => {
      if(obj === null) return null
      
      if(obj instanceof Array) {
        return obj.map(prefixLinks)
      }
      
      if(typeof(obj) === 'object') {
        obj = mapObject(obj, prefixLinks)
        if('links' in obj) {
          obj.links = mapObject(obj.links, prefixLink)
        }
        return obj
      }
      
      return obj
    }
        
    return {
      ...response,
      entity: prefixLinks(response.entity)
    }
  }
})

//
// REST interceptor that derives some data about switches from the source API
// data.  Currently just handles waiting to reflect final state until the ST API
// has had a chance to get updated usage info from the switch.
//
export const switchesInterceptor = interceptor({
  response: (response, config) => {
    const { unpluggedTimeThreshold = 0, unpluggedUsageThreshold = 0 } = config

    const addUsageInformationToSwitchEntity = entity => {
      if(entity instanceof Array) return entity.map(addUsageInformationToSwitchEntity)
      
      const result = {...entity}
      if(result.state.currently == 'on' && result.state.since != null && result.usage != null) {
        const timeOn = Date.now() - Date.parse(result.state.since)

        if(result.usage > unpluggedUsageThreshold) {
          result.unplugged = false
        } else if (timeOn < unpluggedTimeThreshold) {
          result.state.currently = 'turning on'
        } else {
          result.unplugged = true
        }
      }
      
      return result
    }
    
    if(!response.entity) return response
    return {
      ...response,
      entity: addUsageInformationToSwitchEntity(response.entity)
    }
  }
})
