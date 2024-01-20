const passport = require('passport')
const bcrypt = require('bcryptjs')
const User = require('../models/User');
const LocalStrategy = require('passport-local').Strategy
const prometheus = require('prom-client');
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

const esTransportOpts = {
  level: 'info',
  clientOpts: {
    // elasticsearch docker's ip
    node: "http://172.19.0.3:9200"
  },
  indexPrefix: 'app-logs-*',
  index: `app-logs-${new Date().toISOString().split('T')[0]}`
};

const esTransport = new ElasticsearchTransport(esTransportOpts);

const logger = winston.createLogger({
  transports: [
    esTransport
  ],
});

const failedLoginCounter = new prometheus.Counter({
    name: 'failed_login_attempts_total',
    help: 'Total number of failed login attempts',
    labelNames: ['email'],
});  

passport.serializeUser((user, done) => {
    done(null, user.email)
})

passport.deserializeUser(async (email, done) => {
    try {
        const user = await User.findOne({ email: email }) 
        if(user) done(null,user) 
    } catch (error) {
        done(error,false)
    }
})

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (username, password, done) => {
    try {
        const user = await User.findOne({ email: username }).select('+password')
        
        if(!user) done(null,false)
    
        if(bcrypt.compareSync(password, user.password)){
            // Passwords match
            done(null,user)
        } else{
            // Passwords do not match
            const timestamp = new Date().toISOString();
            const message = `Failed login attempt for user: ${username}`;
            logger.error({ message, '@timestamp': timestamp });
            failedLoginCounter.inc({ email: username });
            done(null,false)
        }          
    } catch (error) {
        done(error, false)
    }
  }
))