const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport')
const session = require('express-session')
const local = require('./config/passport')
const dotenv = require('dotenv').config()
const prometheus = require('prom-client');

const app = express();
const port = process.env.BACKEND_PORT;
const authRoute = require('./routes/auth.routes');
const weatherRoute = require('./routes/weather.routes');

// Global unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 60 * 1000,
            sameSite: 'Lax',
            secure: false
         }
}))
app.use(passport.initialize())
app.use(passport.session())


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
  
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
  });

app.use('/auth', authRoute)
app.use('/weather', weatherRoute)


// Create a Registry to register the metrics
const register = new prometheus.Registry();
prometheus.collectDefaultMetrics({ register });

// Define a route to expose the metrics to Prometheus
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await prometheus.register.metrics();
    res.set('Content-Type', prometheus.register.contentType);
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error.message);
  }
});

app.listen(port, () => {
    console.log(`Application is listening at port ${port}`);
});

