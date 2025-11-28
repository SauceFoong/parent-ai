const firestoreService = require('../services/firestoreService');
const logger = require('../utils/logger');

// @desc    Get notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    let notifications = [];
    try {
      // Query without orderBy to avoid index requirement
      notifications = await firestoreService.queryDocuments('notifications', {
        where: [['userId', '==', req.user.id]],
      }, { limit: 100 });
      
      // Sort in JavaScript
      notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      notifications = notifications.slice(0, 50);
    } catch (e) {
      logger.error(`Query error: ${e.message}`);
      notifications = [];
    }

    res.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    logger.error(`Get notifications error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await firestoreService.getDocument('notifications', id);
    
    if (!notification || notification.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    await firestoreService.updateDocument('notifications', id, { 
      read: true,
      readAt: new Date().toISOString(),
    });

    const updatedNotification = await firestoreService.getDocument('notifications', id);

    res.json({
      success: true,
      notification: updatedNotification,
    });
  } catch (error) {
    logger.error(`Mark as read error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
