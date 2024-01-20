const mongoose = require('mongoose');

const mongoUser = process.env.MONGO_USER;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoHost = process.env.MONGO_HOST;
const mongoDb = process.env.MONGO_DB;

mongoose.set('strictQuery', false);

const mongoUri = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}/${mongoDb}`;
mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

mongoose.Promise = global.Promise;

module.exports = mongoose;