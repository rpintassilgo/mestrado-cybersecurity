const mongoose = require('mongoose');

mongoose.set('strictQuery', false);
//const mongoUri = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}/${process.env.MONGO_DB}?directConnection=true`;
mongoose.connect("mongodb://127.0.0.1:27017",/* {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }*/)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

mongoose.Promise = global.Promise;

module.exports = mongoose;
