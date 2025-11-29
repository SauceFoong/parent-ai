const firestoreService = require('../services/firestoreService');
const aiService = require('../services/aiService');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

// @desc    Submit new activity for monitoring
// @route   POST /api/monitoring/activity
// @access  Private
exports.submitActivity = async (req, res) => {
  try {
    const { screenshot, childName, contentTitle, contentUrl, activityType } = req.body;
    
    let aiAnalysis = null;
    let flagged = false;

    // If screenshot is provided, analyze it with AI
    if (screenshot && process.env.OPENAI_API_KEY) {
      try {
        logger.info(`Analyzing screenshot for: ${contentTitle}`);
        aiAnalysis = await aiService.analyzeContent({
          screenshot,
          contentTitle,
          contentUrl,
          activityType,
        });
        
        // Check if content should be flagged
        if (aiAnalysis && aiAnalysis.flagged) {
          flagged = true;
          logger.warn(`Content flagged: ${contentTitle} - ${aiAnalysis.reason}`);
          
          // Send notification to parent
          try {
            const devices = await firestoreService.queryDocuments('linkedDevices', {
              where: [['childName', '==', childName]],
            });
            
            if (devices.length > 0) {
              const parent = await firestoreService.getDocument('users', devices[0].parentId);
              if (parent && parent.deviceTokens && parent.deviceTokens.length > 0) {
                await notificationService.sendPushNotification(
                  parent.deviceTokens,
                  'Content Alert',
                  `${childName} viewed potentially inappropriate content: ${contentTitle}`,
                  { activityType, contentTitle, reason: aiAnalysis.reason }
                );
              }
              
              // Save notification to database
              await firestoreService.createDocument('notifications', {
                userId: devices[0].parentId,
                childName,
                type: 'content_alert',
                title: 'Content Alert',
                message: `${childName} viewed: ${contentTitle}`,
                aiAnalysis,
                read: false,
                createdAt: new Date().toISOString(),
              });
            }
          } catch (notifError) {
            logger.error(`Notification error: ${notifError.message}`);
          }
        }
      } catch (aiError) {
        logger.error(`AI analysis error: ${aiError.message}`);
        // Continue without AI analysis
      }
    }

    const activityData = {
      ...req.body,
      userId: req.user?.id || 'child-device',
      timestamp: new Date().toISOString(),
      flagged,
      aiAnalysis,
      // Don't store the full screenshot in the activity (too large)
      screenshot: screenshot ? '[screenshot captured]' : null,
    };

    const activity = await firestoreService.createDocument('activities', activityData);

    res.status(201).json({
      success: true,
      activity: {
        id: activity.id,
        flagged: activity.flagged,
        aiAnalysis: activity.aiAnalysis,
      },
    });
  } catch (error) {
    logger.error(`Submit activity error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get activity history
// @route   GET /api/monitoring/activities
// @access  Private
exports.getActivities = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    let activities = [];
    try {
      // Query without orderBy to avoid index requirement
      activities = await firestoreService.queryDocuments('activities', {
        where: [['userId', '==', req.user.id]],
      }, { limit: parseInt(limit) * 2 }); // Get more to account for sorting
      
      // Sort in JavaScript
      activities.sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));
      activities = activities.slice(0, parseInt(limit));
    } catch (e) {
      logger.error(`Query error: ${e.message}`);
      activities = [];
    }

    res.json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    logger.error(`Get activities error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get activity statistics
// @route   GET /api/monitoring/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    // Get all activities for this user
    let activities = [];
    try {
      activities = await firestoreService.queryDocuments('activities', {
        where: [['userId', '==', req.user.id]],
      }, { limit: 1000 });
    } catch (e) {
      // If collection doesn't exist or is empty, return empty stats
      activities = [];
    }

    // Calculate stats
    const totalActivities = activities.length;
    const flaggedActivities = activities.filter(a => a.flagged).length;
    const safeActivities = totalActivities - flaggedActivities;
    const flagRate = totalActivities > 0 
      ? Math.round((flaggedActivities / totalActivities) * 100) 
      : 0;

    // Get activity breakdown by type
    const activitiesByType = activities.reduce((acc, activity) => {
      const type = activity.activityType || 'unknown';
      const existing = acc.find(a => a._id === type);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ _id: type, count: 1 });
      }
      return acc;
    }, []);

    // Get recent flagged activities (sort in JS)
    const recentFlags = activities
      .filter(a => a.flagged)
      .sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt))
      .slice(0, 5);

    res.json({
      success: true,
      stats: {
        totalActivities,
        flaggedActivities,
        safeActivities,
        flagRate,
        activitiesByType,
        recentFlags,
      },
    });
  } catch (error) {
    logger.error(`Get stats error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update activity duration
// @route   PUT /api/monitoring/activity/:id/duration
// @access  Private
exports.updateDuration = async (req, res) => {
  try {
    const { id } = req.params;
    const { duration } = req.body;

    await firestoreService.updateDocument('activities', id, { duration });
    const activity = await firestoreService.getDocument('activities', id);

    res.json({
      success: true,
      activity,
    });
  } catch (error) {
    logger.error(`Update duration error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
