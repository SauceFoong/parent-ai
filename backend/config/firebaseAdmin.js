const admin = require('firebase-admin');
const path = require('path');
const logger = require('../utils/logger');

let firebaseApp;
let db;

/**
 * Initialize Firebase Admin SDK
 */
const initializeFirebase = () => {
  try {
    // Check if already initialized
    if (firebaseApp) {
      logger.info('Firebase already initialized');
      return { app: firebaseApp, db };
    }

    // Path to service account key
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
      path.join(process.env.HOME, '.firebase', 'parent-ai-serviceAccountKey.json');

    // Initialize Firebase Admin
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(require(serviceAccountPath)),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'parent-ai-cf603.appspot.com',
    });

    // Get Firestore instance
    db = admin.firestore();
    
    // Configure Firestore settings
    db.settings({
      timestampsInSnapshots: true,
      ignoreUndefinedProperties: true,
    });

    logger.info('Firebase Admin SDK initialized successfully');
    logger.info(`Storage Bucket: ${process.env.FIREBASE_STORAGE_BUCKET || 'parent-ai-cf603.appspot.com'}`);

    return { app: firebaseApp, db };
  } catch (error) {
    logger.error(`Error initializing Firebase: ${error.message}`);
    throw error;
  }
};

/**
 * Get Firestore instance
 */
const getFirestore = () => {
  if (!db) {
    const { db: database } = initializeFirebase();
    return database;
  }
  return db;
};

/**
 * Get Firebase Storage instance
 */
const getStorage = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.storage();
};

/**
 * Get Firebase Auth instance
 */
const getAuth = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.auth();
};

/**
 * Get Firebase Messaging instance
 */
const getMessaging = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.messaging();
};

module.exports = {
  initializeFirebase,
  getFirestore,
  getStorage,
  getAuth,
  getMessaging,
  admin,
};

