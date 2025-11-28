const admin = require('firebase-admin');
const path = require('path');
const logger = require('../utils/logger');

let firebaseApp;
let db;

/**
 * Get Firebase credentials from environment or file
 */
const getFirebaseCredentials = () => {
  // Option 1: Full service account JSON as env variable (for production/Render)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON');
      throw e;
    }
  }

  // Option 2: Individual env variables (alternative for production)
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    return {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID || 'parent-ai-cf603',
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || '',
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID || '',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_CERT_URL || '',
    };
  }

  // Option 3: Load from file (for local development)
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
    path.join(process.env.HOME, '.firebase', 'parent-ai-serviceAccountKey.json');
  
  return require(serviceAccountPath);
};

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

    const serviceAccount = getFirebaseCredentials();

    // Initialize Firebase Admin
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
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


