const Activity = require('../models/Activity');
const aiService = require('./aiService');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');

class MonitoringService {
  /**
   * Process and analyze a new activity
   * @param {Object} activityData - Activity data from mobile app
   * @returns {Object} Processed activity with analysis
   */
  async processActivity(activityData) {
    try {
      const {
        userId,
        childName,
        deviceId,
        activityType,
        contentTitle,
        contentDescription,
        appName,
        url,
        screenshot,
      } = activityData;

      logger.info(`Processing activity: ${contentTitle} for child ${childName}`);

      // Analyze content using AI
      const contentText = `${contentTitle} ${contentDescription || ''} ${appName || ''}`;
      const analysis = await aiService.analyzeContent(screenshot, contentText);

      // Create activity record
      const activity = await Activity.create({
        userId,
        childName,
        deviceId,
        activityType,
        contentTitle,
        contentDescription,
        appName,
        url,
        screenshot,
        aiAnalysis: analysis,
        flagged: analysis.isInappropriate,
        timestamp: new Date(),
      });

      // Check if notification should be sent
      const user = await require('../models/User').findById(userId);
      const notificationDecision = aiService.shouldNotify(analysis, user.settings);

      if (notificationDecision.shouldNotify) {
        // Generate notification content
        const notificationContent = notificationService.generateNotificationContent(
          activity,
          analysis
        );
        notificationContent.severity = notificationDecision.severity;

        // Send notification
        await notificationService.createAndSendNotification(
          userId,
          activity._id,
          notificationContent
        );

        activity.notificationSent = true;
        await activity.save();
      }

      logger.info(`Activity processed successfully: ${activity._id}`);
      return activity;
    } catch (error) {
      logger.error(`Error processing activity: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get activity history for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Query filters
   * @returns {Array} Activities
   */
  async getActivityHistory(userId, filters = {}) {
    try {
      const {
        childName,
        activityType,
        flagged,
        startDate,
        endDate,
        limit = 50,
        skip = 0,
      } = filters;

      const query = { userId };

      if (childName) query.childName = childName;
      if (activityType) query.activityType = activityType;
      if (flagged !== undefined) query.flagged = flagged;
      
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      const activities = await Activity.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip);

      return activities;
    } catch (error) {
      logger.error(`Error fetching activity history: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get activity statistics for dashboard
   * @param {string} userId - User ID
   * @param {Object} filters - Query filters
   * @returns {Object} Statistics
   */
  async getActivityStats(userId, filters = {}) {
    try {
      const { childName, startDate, endDate } = filters;

      const query = { userId };
      if (childName) query.childName = childName;
      
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      const totalActivities = await Activity.countDocuments(query);
      const flaggedActivities = await Activity.countDocuments({ ...query, flagged: true });
      
      const activitiesByType = await Activity.aggregate([
        { $match: query },
        { $group: { _id: '$activityType', count: { $sum: 1 } } },
      ]);

      const recentFlags = await Activity.find({ ...query, flagged: true })
        .sort({ timestamp: -1 })
        .limit(10)
        .select('contentTitle childName timestamp aiAnalysis.summary');

      return {
        totalActivities,
        flaggedActivities,
        safeActivities: totalActivities - flaggedActivities,
        activitiesByType,
        recentFlags,
        flagRate: totalActivities > 0 ? (flaggedActivities / totalActivities * 100).toFixed(2) : 0,
      };
    } catch (error) {
      logger.error(`Error fetching activity stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update activity duration (called periodically from mobile app)
   * @param {string} activityId - Activity ID
   * @param {number} duration - Duration in seconds
   */
  async updateActivityDuration(activityId, duration) {
    try {
      const activity = await Activity.findByIdAndUpdate(
        activityId,
        { duration },
        { new: true }
      );

      return activity;
    } catch (error) {
      logger.error(`Error updating activity duration: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new MonitoringService();

