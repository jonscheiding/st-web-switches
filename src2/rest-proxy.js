import parseUrl from 'parseurl'

export default (client) => (req, res) => {
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

  client(serverRequest).then(serverResponse => {
    res.status(serverResponse.status.code)
    res.set('Content-Type', serverResponse.headers['Content-Type'])
    res.send(serverResponse.entity)
  })
  .catch(err => res.status(500).send(err.toString()))
}