import express from 'express'
import moment from 'moment'
import nock from 'nock'
import supertest from 'supertest'

import api from 'src/api'

const USAGE_THRESHOLD = 10 // The value doesn't really matter

describe('The Smartapp API proxy', () => {
  const app = express()
  app.use('/prefix', api({
    SMARTAPP_BASE_URL: 'http://smartapp',
    SMARTAPP_ACCESS_TOKEN: 'access_token',
    UNPLUGGED_USAGE_THRESHOLD: USAGE_THRESHOLD
  }))
  const client = supertest(app)
  
  it('should rewrite URLs to call the smartapp', () => {
    const n = nock('http://smartapp')
      .get('/some/endpoint')
      .reply(200, { me: true })
      
    return client.get('/prefix/some/endpoint')
      .expect(200, { me: true })
      .then(() => n.done())
  })
  
  it('should translate a call to "/" to a call to "/app"', () => {
    const n = nock('http://smartapp')
      .get('/app')
      .reply(200, { request: true })
    
    return client.get('/prefix').expect(200).then(() => n.done())
  })
  
  it('should rewrite links on the results object', () => {
    const n = nock('http://smartapp')
      .get('/app')
      .reply(200, { links: {
        self: '/here',
        other: '/there'
      }})
      
    return client.get('/prefix')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect({
        links: {
          self: '/prefix/here',
          other: '/prefix/there'
        }
      })
      .then(() => n.done())
  })
  
  it('should return switches with state "turning on" if there is no usage at first', () => {
    const sw = {
      state: { 
        currently: 'on',
        since: moment().add(-2, 'seconds').format()
      },
      usage: 0
    }
    
    const n = nock('http://smartapp')
      .get('/switches/1')
      .reply(200, sw)
      
    return client.get('/prefix/switches/1')
      .expect({
        ...sw,
        state: { ...sw.state, currently: 'turning on' }
      })
      .then(() => n.done())
  })
    
  it('should return switches with "unplugged" if there is no usage for over 5 seconds', () => {
    const sw = {
      state: { 
        currently: 'on',
        since: moment().add(-10, 'seconds').format()
      },
      usage: 0
    }
    
    const n = nock('http://smartapp')
      .get('/switches/1')
      .reply(200, sw)
      
    return client.get('/prefix/switches/1')
      .expect({
        ...sw,
        unplugged: true
      })
      .then(() => n.done())
  })
  
  it('should return switches with "unplugged" if usage is below the threshold', () => {
    const sw = {
      state: { 
        currently: 'on',
        since: moment().add(-10, 'seconds').format()
      },
      usage: USAGE_THRESHOLD - 1
    }
    
    const n = nock('http://smartapp')
      .get('/switches/1')
      .reply(200, sw)
      
    return client.get('/prefix/switches/1')
      .expect({
        ...sw,
        unplugged: true
      })
      .then(() => n.done())    
  })
  
  it('should return switches with not "unplugged" if usage is above the threshold', () => {
    const sw = {
      state: { 
        currently: 'on',
        since: moment().add(-10, 'seconds').format()
      },
      usage: USAGE_THRESHOLD + 1
    }
    
    const n = nock('http://smartapp')
      .get('/switches/1')
      .reply(200, sw)
      
    return client.get('/prefix/switches/1')
      .expect({
        ...sw,
        unplugged: false
      })
      .then(() => n.done())    
  })
})