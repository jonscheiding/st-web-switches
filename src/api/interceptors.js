import interceptor from 'rest/interceptor'
import mapObject from 'object.map'
import url from 'url'

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

export const switchesInterceptor = interceptor({
  response: (response, config) => {
    const { unpluggedTimeThreshold = 0, unpluggedUsageThreshold = 0 } = config

    const addUsageInformationToSwitchEntity = entity => {
      if(entity instanceof Array) return entity.map(addUsageInformationToSwitchEntity)
      
      const result = {...entity}
      if(result.state.currently == 'on' && result.state.since != null && result.usage != null) {
        const timeOn = Date.now() - Date.parse(result.state.since)

        if(result.usage <= unpluggedUsageThreshold && timeOn < unpluggedTimeThreshold) {
          result.state.currently = 'turning on'
        } else {
          result.unplugged = (result.usage <= unpluggedUsageThreshold)
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