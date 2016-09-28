import express from 'express'
import expressSession from 'express-session'
import ensureLogin from 'connect-ensure-login'
import passport from 'passport'
import OAuth2Strategy from 'passport-oauth2'

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user))

passport.use(new OAuth2Strategy({
  authorizationURL: 'http://schedulemaster-api.herokuapp.com/oauth2/authorize',
  tokenURL: 'http://schedulemaster-api.herokuapp.com/oauth2/token',
  clientID: process.env.SM_OAUTH_ID,
  clientSecret: process.env.SM_OAUTH_SECRET,
  callbackURL: '/login',
  scope: 'login'
},
  function(accessToken, refreshToken, profile, cb) {
    return cb(null, accessToken)
  }
))

var callback = express.Router()
callback.get('/login', passport.authenticate('oauth2', { failureRedirect: '/', successRedirect: '/' }))

export default [
  expressSession({resave: false, saveUninitialized: true, secret: 'TODO'}),
  passport.initialize(),
  passport.session(),
  callback,
  ensureLogin.ensureLoggedIn('/login')
]
