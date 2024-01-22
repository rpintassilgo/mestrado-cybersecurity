const passport = require('passport')
const bcrypt = require('bcryptjs')
const User = require('../models/User');
const LocalStrategy = require('passport-local').Strategy
const prometheus = require('prom-client');
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');
const redisClient = require('./redis');

const esTransportOpts = {
  level: 'info',
  clientOpts: {
    // elasticsearch docker's ip
    node: "http://172.18.0.2:9200"
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
        if(user){
        	done(null,user) 
        	return
        }
    } catch (error) {
        done(error,false)
        return;
    }
})

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (username, password, done) => {
    try {
        const lockKey = `${username}-lock`;
        const lockValue = await redisClient.get(lockKey);
        if (lockValue && new Date().getTime() < parseInt(lockValue)) {
            // Include a message in the done function
            done(null, false, { message: 'Account is temporarily locked' });
            return;
        }
        
        const user = await User.findOne({ email: username }).select('+password');
        
        if (!user) {
            // Include a message in the done function
            done(null, false, { message: 'Incorrect username' });
            return;
        }
    
        if (bcrypt.compareSync(password, user.password)) {
            // Passwords match
            await redisClient.set(`${username}-login`, 0);
            done(null, user);
        } else {
            // Passwords do not match
            const timestamp = new Date().toISOString();
            const message = `Failed login attempt for user: ${username}`;
            logger.error({ message, '@timestamp': timestamp });
            failedLoginCounter.inc({ email: username });
            
            const failedKey = `${username}-login`;
            const failedAttempts = parseInt(await redisClient.get(failedKey) || '0') + 1;
            await redisClient.set(failedKey, failedAttempts);
            
            if (failedAttempts >= 3) {
                // Lock account for 30 seconds
                await redisClient.set(lockKey, new Date().getTime() + 30000);
            }

            // Include a message in the done function
            done(null, false, { message: 'Incorrect password' });
        }          
    } catch (error) {
        done(error);
    }
}));
