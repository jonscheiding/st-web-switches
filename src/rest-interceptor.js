import interceptor from 'rest/interceptor'

export const accessTokenInterceptor = interceptor({
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

export const entityRewriteInterceptor = interceptor({
  response: (response, options) => {
    if(!response.entity) return response
    if(!options.rewriteEntity) return response
    
    return {
      ...response,
      entity: options.rewriteEntity(response.entity)
    }
  }
})

export const urlRewriteInterceptor = interceptor({
  request: (request) => {
    switch(request.path) {
      case '/': 
        request.path = '/app'
    }
    
    return request
  }
})

