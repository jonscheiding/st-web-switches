import envalid from 'envalid'
import express from 'express'
import expressSession from 'express-session'
import ensureLogin from 'connect-ensure-login'
import interceptor from 'rest/interceptor'
import jwt from 'jsonwebtoken'
import passport from 'passport'
import OAuth2Strategy from 'passport-oauth2'
import path from 'path'

import { proxyInterceptor } from '../api/express-rest-proxy'

const mergeEntity = (entity, obj) => 
  JSON.stringify({
    ...JSON.parse(entity),
    ...obj
  })

const fnllcInterceptor = interceptor({
  response: (response) => {
    //response.entity.docLink = '/doc'
    response.entity = mergeEntity(response.entity, {
      help: {
        doc: '/doc'
      }
    })
    return response
  }
})

envalid.validate(process.env, {
  SESSION_SECRET: { required: true },
  SM_OAUTH_ID: { required: true },
  SM_OAUTH_SECRET: { required: true },
  SM_API_URL: { required: true }
})

passport.serializeUser((user, done) => {
  done(null, user.token)
})
passport.deserializeUser((user, done) => {
  done(null, {
    ...jwt.decode(user),
    token: user
  })
})

passport.use('fnllc', new OAuth2Strategy({
  authorizationURL: process.env.SM_API_URL + '/oauth2/authorize',
  tokenURL: process.env.SM_API_URL + '/oauth2/token',
  clientID: process.env.SM_OAUTH_ID,
  clientSecret: process.env.SM_OAUTH_SECRET,
  callbackURL: '/login',
  scope: 'login'
},
  function(accessToken, refreshToken, profile, cb) {
    return passport.deserializeUser(accessToken, cb)
  }
))

var app = express.Router()
app.get('/login', passport.authenticate('fnllc', { failureRedirect: '/', successRedirect: '/' }))
app.get('/logout', (req, res) => {
  req.logout()
  res.redirect(process.env.SM_API_URL + '/oauth2/logout')
})
app.get('/favicon.png', (req, res, next) => res.sendFile(path.resolve(__dirname, 'fnllc-favicon.png'), null, next))
app.get('/touch-icon.png', (req, res, next) => res.sendFile(path.resolve(__dirname, 'fnllc-touch-icon.png'), null, next))

app.get('/api', proxyInterceptor(fnllcInterceptor))

app.use('/doc', express.static(path.resolve(__dirname, 'doc')))

export default () => [
  expressSession({
    resave: false, saveUninitialized: true, 
    secret: process.env.SESSION_SECRET
  }),
  passport.initialize(),
  passport.session(),
  (req, res, next) => {
    res.set('X-Logged-In', true)
    next()
  },
  app,
  ensureLogin.ensureLoggedIn('/login')
]
