const firestoreService = require('../services/firestoreService');
const logger = require('../utils/logger');

// @desc    Submit new activity for monitoring
// @route   POST /api/monitoring/activity
// @access  Private
exports.submitActivity = async (req, res) => {
  try {
    const activityData = {
      ...req.body,
      userId: req.user.id,
      timestamp: new Date().toISOString(),
      flagged: false,
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
