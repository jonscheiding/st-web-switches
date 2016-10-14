import rest from 'rest'
import parseUrl from 'parseurl'

export const proxy = () => (req, res) => {
  const url = parseUrl(req)

  const serverRequest = {
    method: req.method,
    path: url.path,
    headers: {}
  }
  
  if(req.method != 'GET' && req.body) {
    serverRequest.entity = req.body
  }
  
  if(req.get('Content-Type')) {
    serverRequest.headers['Content-Type'] = req.get('Content-Type')
  }
  
  let client = rest
  for(let pi of req.proxyInterceptors || []) {
    client = client.wrap(pi.interceptor, pi.config)
  }

  client(serverRequest).then(serverResponse => {
    res.status(serverResponse.status.code)
    res.set('Content-Type', serverResponse.headers['Content-Type'])
    res.send(serverResponse.entity)
  })
  .catch(err => res.status(500).send(err.toString()))
}

export const proxyInterceptor = (interceptor, config) => (req, res, next) => {
  if(!req.proxyInterceptors) req.proxyInterceptors = []
  req.proxyInterceptors.push({interceptor, config})
  next()  
}