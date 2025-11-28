const express = require('express');
const router = express.Router();
const firestoreService = require('../services/firestoreService');
const storageService = require('../services/firebaseStorageService');
const logger = require('../utils/logger');

// @desc    Test Firestore connection
// @route   GET /api/test/firestore
// @access  Public (for testing)
router.get('/firestore', async (req, res) => {
  try {
    // Create a test document
    const testDoc = await firestoreService.createDocument('test', {
      message: 'Hello from Parent AI!',
      timestamp: new Date().toISOString(),
    });

    // Read it back
    const retrieved = await firestoreService.getDocument('test', testDoc.id);

    // Delete it
    await firestoreService.deleteDocument('test', testDoc.id);

    res.json({
      success: true,
      message: 'Firestore is working!',
      test: {
        created: testDoc,
        retrieved,
        deleted: true,
      },
    });
  } catch (error) {
    logger.error(`Firestore test error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Firestore test failed',
      error: error.message,
    });
  }
});

// @desc    Test Firebase Storage
// @route   POST /api/test/storage
// @access  Public (for testing)
router.post('/storage', async (req, res) => {
  try {
    const { content, fileName } = req.body;

    if (!content || !fileName) {
      return res.status(400).json({
        success: false,
        message: 'Content and fileName are required',
      });
    }

    // Upload test file
    const result = await storageService.uploadFile(
      `test/${fileName}`,
      content,
      {
        contentType: 'text/plain',
        public: true,
      }
    );

    // Get metadata
    const metadata = await storageService.getFileMetadata(`test/${fileName}`);

    // Clean up - delete test file
    await storageService.deleteFile(`test/${fileName}`);

    res.json({
      success: true,
      message: 'Firebase Storage is working!',
      test: {
        uploaded: result,
        metadata,
        deleted: true,
      },
    });
  } catch (error) {
    logger.error(`Storage test error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Storage test failed',
      error: error.message,
    });
  }
});

// @desc    Initialize Firestore collections with sample data
// @route   POST /api/test/init-firestore
// @access  Public (for testing)
router.post('/init-firestore', async (req, res) => {
  try {
    // Create sample user
    const user = await firestoreService.createDocument('users', {
      email: 'demo@parentai.com',
      name: 'Demo Parent',
      role: 'parent',
      children: [
        {
          name: 'Demo Child',
          age: 10,
          deviceId: 'demo-device-001',
        },
      ],
      settings: {
        violenceThreshold: 0.6,
        inappropriateThreshold: 0.7,
        adultContentThreshold: 0.8,
        notificationsEnabled: true,
        monitoringEnabled: true,
      },
      deviceTokens: [],
    });

    // Create sample activity
    const activity = await firestoreService.createDocument('activities', {
      userId: user.id,
      childName: 'Demo Child',
      deviceId: 'demo-device-001',
      activityType: 'video',
      contentTitle: 'Educational Science Video',
      contentDescription: 'Learning about space and planets',
      appName: 'YouTube',
      url: 'https://youtube.com/example',
      aiAnalysis: {
        isInappropriate: false,
        violenceScore: 0.1,
        adultContentScore: 0.0,
        inappropriateScore: 0.05,
        detectedCategories: ['Educational', 'Science'],
        summary: 'Safe educational content about space',
        confidence: 0.95,
      },
      flagged: false,
      notificationSent: false,
      timestamp: new Date().toISOString(),
      duration: 300,
    });

    // Create sample notification
    const notification = await firestoreService.createDocument('notifications', {
      userId: user.id,
      activityId: activity.id,
      title: '✅ Demo: Safe Content Detected',
      message: 'Demo Child is watching educational content about space.',
      severity: 'low',
      read: false,
      sent: true,
      sentAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Firestore initialized with sample data!',
      data: {
        user,
        activity,
        notification,
      },
    });
  } catch (error) {
    logger.error(`Init Firestore error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize Firestore',
      error: error.message,
    });
  }
});

// @desc    Get Firestore statistics
// @route   GET /api/test/firestore-stats
// @access  Public (for testing)
router.get('/firestore-stats', async (req, res) => {
  try {
    const collections = ['users', 'activities', 'notifications'];
    const stats = {};

    for (const collection of collections) {
      const documents = await firestoreService.getAllDocuments(collection, 10);
      stats[collection] = {
        count: documents.length,
        sample: documents.slice(0, 3),
      };
    }

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error(`Firestore stats error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get Firestore stats',
      error: error.message,
    });
  }
});

module.exports = router;

