const redis = require('redis');

const client = redis.createClient()
  /*host: 127.0.0.1, 
  port: 6379,                       
  //password: process.env.REDIS_PASSWORD
});*/

client.on('error', (err) => console.log('Redis Client Error', err));

try {
    (async () => await client.connect())();
} catch (error) {
    console.log("Redis connection error: " + error);
}

module.exports = client;
