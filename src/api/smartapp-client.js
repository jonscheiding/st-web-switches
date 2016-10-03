import rest from 'rest'
import interceptor from 'rest/interceptor'
import pathPrefixInterceptor from 'rest/interceptor/pathPrefix'

const accessTokenInterceptor = interceptor({
  request: (request, options) => {
    if(!options.accessToken) return request
    
    return {
      ...request,
      headers: {
        Authorization: 'Bearer ' + options.accessToken,
        ...request.headers
      }
    }
  }
})

// 
// const resourceInterceptor = interceptor({
//   response: (response, config) => {
//     
//   }
// })

export default config => 
  rest
      .wrap(accessTokenInterceptor, { accessToken: config.accessToken })
      .wrap(pathPrefixInterceptor, { prefix: config.baseUrl })
