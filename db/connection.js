const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/my_database'; // Or your MongoDB Atlas URI

const connectDB = async () => {
  try {
    await mongoose.connect(uri);
    console.log('MongoDB Connected successfully!');

    const db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
      console.log('Database connection: open');
    });
  } catch (err) {
    console.error(err.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
