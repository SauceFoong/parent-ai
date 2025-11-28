require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/database');
const { initializeFirebase } = require('./config/firebase');
const { initializeFirebase: initFirebaseAdmin } = require('./config/firebaseAdmin');
const logger = require('./utils/logger');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Connect to database (MongoDB - optional)
try {
  connectDB();
} catch (error) {
  logger.warn(`MongoDB connection skipped: ${error.message}`);
  logger.info('Using Firebase/Firestore as primary database');
}

// Initialize Firebase (for push notifications)
try {
  initializeFirebase();
} catch (error) {
  logger.warn(`Firebase push notifications skipped: ${error.message}`);
}

// Initialize Firebase Admin (for Firestore & Storage)
try {
  initFirebaseAdmin();
  logger.info('Firebase Admin SDK initialized - Using Firestore as primary database');
} catch (error) {
  logger.error(`Firebase Admin initialization failed: ${error.message}`);
  process.exit(1);
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/monitoring', require('./routes/monitoring'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/test', require('./routes/test'));

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Parent AI API Server',
    version: '1.0.0',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Server error: ${err.message}`);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on ${HOST}:${PORT}`);
  logger.info(`Local: http://localhost:${PORT}`);
  logger.info(`Network: http://192.168.1.4:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

