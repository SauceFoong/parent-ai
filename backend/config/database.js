const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    // Skip MongoDB if URI not configured
    if (!process.env.MONGODB_URI || process.env.MONGODB_URI === 'mongodb://localhost:27017/parent-ai') {
      logger.info('MongoDB not configured - using Firestore as primary database');
      return;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.warn(`MongoDB connection failed: ${error.message}`);
    logger.info('Continuing with Firestore as primary database');
    // Don't exit - continue with Firestore
  }
};

module.exports = connectDB;

