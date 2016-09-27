var express = require("express");
var expressSession = require("express-session");
var ensureLogin = require("connect-ensure-login");
var passport = require("passport");
var OAuth2Strategy = require("passport-oauth2");

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(new OAuth2Strategy({
    authorizationURL: 'http://schedulemaster-api.herokuapp.com/oauth2/authorize',
    tokenURL: 'http://schedulemaster-api.herokuapp.com/oauth2/token',
    clientID: process.env.SM_OAUTH_ID,
    clientSecret: process.env.SM_OAUTH_SECRET,
    callbackURL: "/login",
    scope: "login"
  },
  function(accessToken, refreshToken, profile, cb) {
    return cb(null, accessToken)
  }
));

var callback = express.Router();
callback.get('/login', passport.authenticate('oauth2', { failureRedirect: '/', successRedirect: '/' }))

module.exports = [
  expressSession({resave: false, saveUninitialized: true, secret: 'TODO'}),
  passport.initialize(),
  passport.session(),
  callback,
  ensureLogin.ensureLoggedIn("/login")
];
