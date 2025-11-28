const { sendPushNotification } = require('../config/firebase');
const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../utils/logger');

class NotificationService {
  /**
   * Create and send notification to parent
   * @param {string} userId - Parent user ID
   * @param {string} activityId - Activity ID
   * @param {Object} notificationData - Notification content
   */
  async createAndSendNotification(userId, activityId, notificationData) {
    try {
      const { title, message, severity } = notificationData;

      // Create notification in database
      const notification = await Notification.create({
        userId,
        activityId,
        title,
        message,
        severity,
      });

      // Get user's device tokens
      const user = await User.findById(userId);
      
      if (!user || !user.settings.notificationsEnabled) {
        logger.info(`Notifications disabled for user ${userId}`);
        return notification;
      }

      // Send push notifications to all user's devices
      const pushPromises = user.deviceTokens.map(async (token) => {
        try {
          await sendPushNotification(
            token,
            title,
            message,
            {
              activityId: activityId.toString(),
              severity,
              type: 'content_alert',
            }
          );
        } catch (error) {
          logger.error(`Failed to send push to token: ${error.message}`);
        }
      });

      await Promise.allSettled(pushPromises);

      // Update notification as sent
      notification.sent = true;
      notification.sentAt = new Date();
      await notification.save();

      logger.info(`Notification sent to user ${userId} for activity ${activityId}`);
      return notification;
    } catch (error) {
      logger.error(`Error creating notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get unread notifications for a user
   * @param {string} userId - User ID
   * @returns {Array} Notifications
   */
  async getUnreadNotifications(userId) {
    try {
      const notifications = await Notification.find({
        userId,
        read: false,
      })
      .populate('activityId')
      .sort({ createdAt: -1 })
      .limit(50);

      return notifications;
    } catch (error) {
      logger.error(`Error fetching notifications: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { read: true },
        { new: true }
      );

      return notification;
    } catch (error) {
      logger.error(`Error marking notification as read: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate notification message based on analysis
   * @param {Object} activity - Activity data
   * @param {Object} analysis - AI analysis results
   * @returns {Object} Notification content
   */
  generateNotificationContent(activity, analysis) {
    const { childName, contentTitle, activityType } = activity;
    const { detectedCategories, summary, violenceScore, adultContentScore } = analysis;

    let severity = 'medium';
    const maxScore = Math.max(violenceScore, adultContentScore, analysis.inappropriateScore);
    
    if (maxScore >= 0.9) severity = 'critical';
    else if (maxScore >= 0.8) severity = 'high';
    else if (maxScore >= 0.7) severity = 'medium';
    else severity = 'low';

    const title = `⚠️ Alert: ${childName}'s ${activityType} activity`;
    
    const categories = detectedCategories.join(', ');
    const message = `${childName} is watching/playing "${contentTitle}" which may contain ${categories}. ${summary}`;

    return { title, message, severity };
  }
}

module.exports = new NotificationService();

