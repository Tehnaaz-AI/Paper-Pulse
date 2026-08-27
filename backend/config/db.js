// MOCK - Replace/Integrate with Laxman's shared MongoDB connection setup
const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/paper_pulse';
  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.warn(`[Database Warning] MongoDB connection not available (${error.message}). Operating in Mock/In-Memory mode.`);
    return false;
  }
};

const isDbConnected = () => isConnected;

module.exports = {
  connectDB,
  isDbConnected
};
