import { expect } from 'chai'
import nock from 'nock'
import rest from 'rest'
import mimeInterceptor from 'rest/interceptor/mime'

import { accessTokenInterceptor, pathRewriteInterceptor, prefixLinksInterceptor } from 'src/api/interceptors'

String.prototype.reverse = function() {
  return this.split('').reverse().join('')
}

describe('Interceptors', () => {
  describe('pathRewriteInterceptor', () => {
    it('should leave paths alone if config is not provided', () => {
      const n = nock('http://host')
        .get('/foo').reply(200)
        .get('/foo').reply(200)
      
      const client1 = rest.wrap(pathRewriteInterceptor)
      const client2 = rest.wrap(pathRewriteInterceptor, {})
      const request = Promise.all([
        client1('http://host/foo'),
        client2('http://host/foo')
      ])
      
      return request.then(() => n.done())
    })
    
    it('should rewrite paths to a single static value if provided', () => {
      const n = nock('http://host')
        .get('/foo').reply(200)
        .get('/foo').reply(200)
        
      const client = rest.wrap(pathRewriteInterceptor, { path: '/foo' })
      const request = Promise.all([
        client('http://host/bar'),
        client('http://host/baz')
      ])
      
      return request.then(() => n.done())
    })
    
    it('should rewrite paths using a function if provided', () => {
      const n = nock('http://host')
        .get('/foo').reply(200)
        .get('/bar').reply(200)
        
      const client = rest.wrap(pathRewriteInterceptor, { rewritePath: path => '/' + path.substring(1).reverse() })
      const request = Promise.all([
        client('http://host/oof'),
        client('http://host/rab')
      ])
      
      return request.then(() => n.done())
    })
    
    it('should prefer the function if both function and static path are provided', () => {
      const n = nock('http://host').get('/bar').reply(200)
      
      const client = rest.wrap(pathRewriteInterceptor, { rewritePath: () => '/bar', path: '/baz' })
      const request = client('http://host/foo')
      
      return request.then(() => n.done())
    })
  })

  describe('prefixLinksInterceptor', () => {
    const restMime = rest.wrap(mimeInterceptor)
    
    it('should leave objects alone if there is no prefix specified', () => {
      const entity = { links: { self: '/foo' }, fooProperty: 'foo', barProperty: 'bar' }
      const n = nock('http://host').get('/foo').reply(200, entity)
      
      let client = restMime.wrap(prefixLinksInterceptor)
      const request = client('http://host/foo')
      
      return request
        .then(response => {
          expect(response.entity).to.deep.equal(entity)
        })
        .then(() => n.done())
    })
    
    it('should leave objects alone if they have no links', () => {
      const entity = { fooProperty: 'foo', barProperty: 'bar' }
      const n = nock('http://host').get('/foo').reply(200, entity)
      
      const client = restMime.wrap(prefixLinksInterceptor, { prefix: '/prefixed' })
      const request = client('http://host/foo')
      
      return request
        .then(response => {
          expect(response.entity).to.deep.equal(entity)
        })
        .then(() => n.done())
    })
    
    it('should prefix links at the root level of the object', () => {
      const entity = { links: { self: '/foo' }, bar: 'baz' }
      const n = nock('http://host').get('/foo').reply(200, entity)
      
      const client = restMime.wrap(prefixLinksInterceptor, { prefix: '/prefixed' })
      const request = client('http://host/foo')
      
      return request
        .then(response => { 
          expect(response.entity).to.deep.equal({
            links: { self: '/prefixed/foo' },
            bar: 'baz'
          })
        })
        .then(() => n.done())
    })
    
    it('should prefix links on elements if the response is an array', () => {
      const entity = [ { links: { self: '/foo' }, bar: 'baz' } ]
      const n = nock('http://host').get('/foo').reply(200, entity)
      
      const client = restMime.wrap(prefixLinksInterceptor, { prefix: '/prefixed' })
      const request = client('http://host/foo')
      
      return request
        .then(response => { 
          expect(response.entity).to.deep.equal([{
            links: { self: '/prefixed/foo' },
            bar: 'baz'
          }])
        })
        .then(() => n.done())
    })
    
    it('should prefix links throughout the object hierarchy', () => {
      const entity = {
        fooArray: [
          { links: { foo: '/foo' } }
        ],
        foo: {
          links: { foo: '/foo' },
          fooArray2: [
            { links: { foo: '/foo' } }
          ]
        }
      }
      const n = nock('http://host').get('/foo').reply(200, entity)
      
      const client = restMime.wrap(prefixLinksInterceptor, { prefix: '/prefixed' })
      const request = client('http://host/foo')

      return request
        .then(response => { 
          expect(response.entity).to.deep.equal({
            fooArray: [
              { links: { foo: '/prefixed/foo' } }
            ],
            foo: {
              links: { foo: '/prefixed/foo' },
              fooArray2: [
                { links: { foo: '/prefixed/foo' } }
              ]
            }
          })
        })
        .then(() => n.done())

    })
  })

  describe('accessTokenInterceptor', () => {
    it('should add the Authorization header if an access token is provided on the request', () => {
      const n = nock('http://host', {
        reqheaders: { Authorization: 'Bearer 12345' }
      }).get('/').reply(200)
      
      const client = rest.wrap(accessTokenInterceptor)
      const request = client({
        path: 'http://host/',
        accessToken: '12345'
      })
      
      return request.then(() => n.done())
    })

    it('should add the Authorization header if an access token is provided on the config', () => {
      const n = nock('http://host', {
        reqheaders: { Authorization: 'Bearer 12345' }
      }).get('/').reply(200)
      
      const client = rest.wrap(accessTokenInterceptor, { accessToken: '12345' })
      const request = client({
        path: 'http://host/'
      })
      
      return request.then(() => n.done())
    })
    
    it('should prefer the request\'s token over the config\'s if both are provided', () => {
      const n = nock('http://host', {
        reqheaders: { Authorization: 'Bearer 67890' }
      }).get('/').reply(200)
      
      const client = rest.wrap(accessTokenInterceptor, { accessToken: '12345' })
      const request = client({
        path: 'http://host/',
        accessToken: '67890'
      })
      
      return request.then(() => n.done())
    })
  })
})