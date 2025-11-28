const admin = require('firebase-admin');
const logger = require('../utils/logger');

let firebaseApp;

const initializeFirebase = () => {
  try {
    // Initialize Firebase Admin SDK
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });

    logger.info('Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    logger.error(`Error initializing Firebase: ${error.message}`);
    // Don't exit, allow app to run without push notifications
    return null;
  }
};

const sendPushNotification = async (deviceToken, title, body, data = {}) => {
  if (!firebaseApp) {
    logger.warn('Firebase not initialized, skipping push notification');
    return null;
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data,
      token: deviceToken,
    };

    const response = await admin.messaging().send(message);
    logger.info(`Push notification sent successfully: ${response}`);
    return response;
  } catch (error) {
    logger.error(`Error sending push notification: ${error.message}`);
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  sendPushNotification,
};

