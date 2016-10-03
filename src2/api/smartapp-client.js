import rest from 'rest'
import interceptor from 'rest/interceptor'
import mimeInterceptor from 'rest/interceptor/mime'
import pathPrefixInterceptor from 'rest/interceptor/pathPrefix'

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

export default rest 
  .wrap(mimeInterceptor)
  .wrap(pathPrefixInterceptor, { prefix: 'https://graph.api.smartthings.com/api/smartapps/installations/2b520eaf-eabe-4a98-a6b9-25eb0226a4d8' })
  .wrap(accessTokenInterceptor, { accessToken: 'c352e5bc-e60e-4adc-a7b7-1704fc4da4b4' })
