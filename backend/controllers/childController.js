const firestoreService = require('../services/firestoreService');
const { generateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Generate a random 6-digit pairing code
const generatePairingCodeValue = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Generate pairing code for parent
// @route   POST /api/child/generate-code
// @access  Private (Parent)
exports.generatePairingCode = async (req, res) => {
  try {
    const parentId = req.user.id;
    
    // Generate unique code
    const code = generatePairingCodeValue();
    
    // Store pairing code with expiration (15 minutes)
    await firestoreService.createDocument('pairingCodes', {
      code,
      parentId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      used: false,
    });

    res.json({
      success: true,
      code,
      expiresIn: 900, // 15 minutes in seconds
    });
  } catch (error) {
    logger.error(`Generate pairing code error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to generate pairing code',
    });
  }
};

// @desc    Link child device to parent account
// @route   POST /api/child/link
// @access  Public
exports.linkDevice = async (req, res) => {
  try {
    const { pairingCode, deviceInfo } = req.body;

    if (!pairingCode || !deviceInfo) {
      return res.status(400).json({
        success: false,
        message: 'Pairing code and device info are required',
      });
    }

    // Find valid pairing code
    const codes = await firestoreService.queryDocuments('pairingCodes', {
      where: [
        ['code', '==', pairingCode],
        ['used', '==', false],
      ],
    });

    if (codes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired pairing code',
      });
    }

    const pairingData = codes[0];

    // Check if code is expired
    if (new Date(pairingData.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Pairing code has expired',
      });
    }

    // Get parent info
    const parent = await firestoreService.getDocument('users', pairingData.parentId);
    if (!parent) {
      return res.status(400).json({
        success: false,
        message: 'Parent account not found',
      });
    }

    // Create linked device record
    const device = await firestoreService.createDocument('linkedDevices', {
      parentId: pairingData.parentId,
      childName: deviceInfo.childName,
      deviceId: deviceInfo.deviceId,
      deviceName: deviceInfo.deviceName,
      deviceType: deviceInfo.deviceType,
      osName: deviceInfo.osName,
      osVersion: deviceInfo.osVersion,
      brand: deviceInfo.brand,
      modelName: deviceInfo.modelName,
      linkedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      isActive: true,
    });

    // Mark pairing code as used
    await firestoreService.updateDocument('pairingCodes', pairingData.id, {
      used: true,
      usedAt: new Date().toISOString(),
      deviceId: device.id,
    });

    // Add child to parent's children array if not exists
    const children = parent.children || [];
    const existingChild = children.find(c => c.name === deviceInfo.childName);
    if (!existingChild) {
      children.push({
        name: deviceInfo.childName,
        deviceId: device.id,
        addedAt: new Date().toISOString(),
      });
      await firestoreService.updateDocument('users', pairingData.parentId, { children });
    }

    // Generate token for the child device
    const token = generateToken(pairingData.parentId);

    res.json({
      success: true,
      message: 'Device linked successfully',
      token,
      deviceToken: device.id,
      parentName: parent.name,
    });
  } catch (error) {
    logger.error(`Link device error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to link device',
    });
  }
};

// @desc    Send heartbeat from child device
// @route   POST /api/child/heartbeat
// @access  Public (with device token)
exports.sendHeartbeat = async (req, res) => {
  try {
    const deviceToken = req.headers['x-device-token'];
    const { childName, timestamp } = req.body;

    if (!deviceToken) {
      return res.status(400).json({
        success: false,
        message: 'Device token required',
      });
    }

    // Update device last seen
    const device = await firestoreService.getDocument('linkedDevices', deviceToken);
    if (device) {
      await firestoreService.updateDocument('linkedDevices', deviceToken, {
        lastSeen: timestamp || new Date().toISOString(),
        isActive: true,
      });
    }

    res.json({
      success: true,
      message: 'Heartbeat received',
    });
  } catch (error) {
    logger.error(`Heartbeat error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to process heartbeat',
    });
  }
};

// @desc    Get linked devices for parent
// @route   GET /api/child/devices
// @access  Private (Parent)
exports.getLinkedDevices = async (req, res) => {
  try {
    const parentId = req.user.id;

    const devices = await firestoreService.queryDocuments('linkedDevices', {
      where: [['parentId', '==', parentId]],
    });

    res.json({
      success: true,
      devices: devices.map(d => ({
        id: d.id,
        childName: d.childName,
        deviceName: d.deviceName,
        deviceType: d.deviceType,
        osName: d.osName,
        lastSeen: d.lastSeen,
        isActive: d.isActive,
        linkedAt: d.linkedAt,
      })),
    });
  } catch (error) {
    logger.error(`Get linked devices error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get linked devices',
    });
  }
};

// @desc    Unlink a device
// @route   DELETE /api/child/devices/:deviceId
// @access  Private (Parent)
exports.unlinkDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const parentId = req.user.id;

    const device = await firestoreService.getDocument('linkedDevices', deviceId);
    
    if (!device || device.parentId !== parentId) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }

    await firestoreService.deleteDocument('linkedDevices', deviceId);

    res.json({
      success: true,
      message: 'Device unlinked successfully',
    });
  } catch (error) {
    logger.error(`Unlink device error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to unlink device',
    });
  }
};

// @desc    Check device link status
// @route   GET /api/child/status
// @access  Public (with device token)
exports.checkStatus = async (req, res) => {
  try {
    const deviceToken = req.headers['x-device-token'];

    if (!deviceToken) {
      return res.json({
        success: true,
        isLinked: false,
      });
    }

    const device = await firestoreService.getDocument('linkedDevices', deviceToken);

    res.json({
      success: true,
      isLinked: !!device,
      device: device ? {
        childName: device.childName,
        linkedAt: device.linkedAt,
      } : null,
    });
  } catch (error) {
    logger.error(`Check status error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to check status',
    });
  }
};

// @desc    Get monitoring settings
// @route   GET /api/child/settings
// @access  Public (with device token)
exports.getSettings = async (req, res) => {
  try {
    const deviceToken = req.headers['x-device-token'];

    if (!deviceToken) {
      return res.status(400).json({
        success: false,
        message: 'Device token required',
      });
    }

    const device = await firestoreService.getDocument('linkedDevices', deviceToken);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }

    const parent = await firestoreService.getDocument('users', device.parentId);
    
    res.json({
      success: true,
      settings: parent?.settings || {
        violenceThreshold: 0.6,
        inappropriateThreshold: 0.7,
        adultContentThreshold: 0.8,
        notificationsEnabled: true,
        monitoringEnabled: true,
      },
    });
  } catch (error) {
    logger.error(`Get settings error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get settings',
    });
  }
};

// @desc    Submit activity summary report (every minute from child device)
// @route   POST /api/child/summary
// @access  Public (with device token)
exports.submitSummary = async (req, res) => {
  try {
    const deviceToken = req.headers['x-device-token'];
    const { childName, timestamp, appState, currentActivity, deviceInfo } = req.body;

    if (!deviceToken) {
      return res.status(400).json({
        success: false,
        message: 'Device token required',
      });
    }

    // Get device to find parent
    const device = await firestoreService.getDocument('linkedDevices', deviceToken);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }

    // Save summary to Firebase collection
    const summary = await firestoreService.createDocument('activitySummaries', {
      parentId: device.parentId,
      childName: childName || device.childName,
      deviceId: deviceToken,
      timestamp: timestamp || new Date().toISOString(),
      appState: appState || 'unknown',
      currentActivity: currentActivity || null,
      deviceInfo: deviceInfo || {},
      createdAt: new Date().toISOString(),
    });

    // Update device last seen
    await firestoreService.updateDocument('linkedDevices', deviceToken, {
      lastSeen: new Date().toISOString(),
      lastActivity: currentActivity,
      isActive: true,
    });

    logger.info(`Summary received from ${childName}: ${currentActivity?.title || 'idle'}`);

    res.json({
      success: true,
      message: 'Summary recorded',
      summaryId: summary.id,
    });
  } catch (error) {
    logger.error(`Submit summary error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to record summary',
    });
  }
};

// @desc    Get all summaries for parent's children
// @route   GET /api/child/summaries
// @access  Private (Parent)
exports.getSummaries = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { limit = 100, startDate, endDate } = req.query;

    // Get summaries for this parent
    const summaries = await firestoreService.queryDocuments('activitySummaries', {
      where: [['parentId', '==', parentId]],
    });

    // Sort by timestamp (newest first) and limit
    const sortedSummaries = summaries
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));

    // Filter by date if provided
    let filteredSummaries = sortedSummaries;
    if (startDate) {
      filteredSummaries = filteredSummaries.filter(s => new Date(s.timestamp) >= new Date(startDate));
    }
    if (endDate) {
      filteredSummaries = filteredSummaries.filter(s => new Date(s.timestamp) <= new Date(endDate));
    }

    res.json({
      success: true,
      count: filteredSummaries.length,
      summaries: filteredSummaries.map(s => ({
        id: s.id,
        childName: s.childName,
        timestamp: s.timestamp,
        appState: s.appState,
        currentActivity: s.currentActivity,
        deviceInfo: s.deviceInfo,
      })),
    });
  } catch (error) {
    logger.error(`Get summaries error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get summaries',
    });
  }
};

// @desc    Get summaries for a specific child
// @route   GET /api/child/summaries/:childName
// @access  Private (Parent)
exports.getChildSummaries = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { childName } = req.params;
    const { limit = 60, minutes = 60 } = req.query; // Default last 60 minutes

    // Get summaries for this child
    const summaries = await firestoreService.queryDocuments('activitySummaries', {
      where: [
        ['parentId', '==', parentId],
        ['childName', '==', childName],
      ],
    });

    // Filter to last N minutes and sort
    const cutoffTime = new Date(Date.now() - parseInt(minutes) * 60 * 1000);
    const recentSummaries = summaries
      .filter(s => new Date(s.timestamp) >= cutoffTime)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));

    // Create a timeline of activities
    const timeline = recentSummaries.map(s => ({
      time: new Date(s.timestamp).toLocaleTimeString(),
      timestamp: s.timestamp,
      activity: s.currentActivity?.title || 'Idle',
      type: s.currentActivity?.type || 'idle',
      duration: s.currentActivity?.duration || 0,
      appState: s.appState,
    }));

    res.json({
      success: true,
      childName,
      count: recentSummaries.length,
      timeline,
      summaries: recentSummaries,
    });
  } catch (error) {
    logger.error(`Get child summaries error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get child summaries',
    });
  }
};

// @desc    Submit app usage data from child device
// @route   POST /api/child/app-usage
// @access  Public (with device token)
exports.submitAppUsage = async (req, res) => {
  try {
    const deviceToken = req.headers['x-device-token'];
    const { childName, timestamp, periodStart, periodEnd, apps } = req.body;

    if (!deviceToken) {
      return res.status(400).json({
        success: false,
        message: 'Device token required',
      });
    }

    // Get device to find parent
    const device = await firestoreService.getDocument('linkedDevices', deviceToken);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }

    // Calculate total screen time
    const totalScreenTime = apps.reduce((sum, app) => sum + (app.totalTimeInForeground || 0), 0);

    // Save app usage to Firebase collection
    const usageRecord = await firestoreService.createDocument('appUsage', {
      parentId: device.parentId,
      childName: childName || device.childName,
      deviceId: deviceToken,
      timestamp: timestamp || new Date().toISOString(),
      periodStart,
      periodEnd,
      totalScreenTime,
      appCount: apps.length,
      apps: apps.map(app => ({
        packageName: app.packageName,
        appName: app.appName,
        totalTimeInForeground: app.totalTimeInForeground,
        lastTimeUsed: app.lastTimeUsed,
      })),
      createdAt: new Date().toISOString(),
    });

    // Check for concerning usage and notify parent if needed
    const concerningApps = apps.filter(app => {
      const concerningPackages = [
        'com.zhiliaoapp.musically', // TikTok
        'com.instagram.android',
        'com.snapchat.android',
      ];
      return concerningPackages.includes(app.packageName) && app.totalTimeInForeground > 60 * 60 * 1000;
    });

    if (concerningApps.length > 0 || totalScreenTime > 4 * 60 * 60 * 1000) {
      // Create notification for parent
      await firestoreService.createDocument('notifications', {
        userId: device.parentId,
        type: 'screen_time_alert',
        title: 'Screen Time Alert',
        message: totalScreenTime > 4 * 60 * 60 * 1000 
          ? `${childName} has used their device for over 4 hours today.`
          : `${childName} has spent significant time on social media apps.`,
        childName,
        data: {
          totalScreenTime,
          concerningApps: concerningApps.map(a => a.appName),
        },
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    logger.info(`App usage received from ${childName}: ${apps.length} apps, ${Math.round(totalScreenTime / 60000)}min total`);

    res.json({
      success: true,
      message: 'App usage recorded',
      usageId: usageRecord.id,
    });
  } catch (error) {
    logger.error(`Submit app usage error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to record app usage',
    });
  }
};

// @desc    Get all app usage for parent's children
// @route   GET /api/child/app-usage
// @access  Private (Parent)
exports.getAppUsage = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { days = 7 } = req.query;

    // Get app usage for this parent's children
    const usageRecords = await firestoreService.queryDocuments('appUsage', {
      where: [['parentId', '==', parentId]],
    });

    // Filter to last N days and sort
    const cutoffTime = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    const recentUsage = usageRecords
      .filter(r => new Date(r.timestamp) >= cutoffTime)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Aggregate by child
    const byChild = {};
    recentUsage.forEach(record => {
      if (!byChild[record.childName]) {
        byChild[record.childName] = {
          childName: record.childName,
          totalScreenTime: 0,
          records: [],
          topApps: {},
        };
      }
      byChild[record.childName].totalScreenTime += record.totalScreenTime;
      byChild[record.childName].records.push(record);
      
      // Aggregate app usage
      record.apps.forEach(app => {
        if (!byChild[record.childName].topApps[app.packageName]) {
          byChild[record.childName].topApps[app.packageName] = {
            packageName: app.packageName,
            appName: app.appName,
            totalTime: 0,
          };
        }
        byChild[record.childName].topApps[app.packageName].totalTime += app.totalTimeInForeground;
      });
    });

    // Convert topApps to sorted array
    Object.values(byChild).forEach(child => {
      child.topApps = Object.values(child.topApps)
        .sort((a, b) => b.totalTime - a.totalTime)
        .slice(0, 10);
    });

    res.json({
      success: true,
      days: parseInt(days),
      children: Object.values(byChild),
    });
  } catch (error) {
    logger.error(`Get app usage error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get app usage',
    });
  }
};

// @desc    Get app usage for a specific child
// @route   GET /api/child/app-usage/:childName
// @access  Private (Parent)
exports.getChildAppUsage = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { childName } = req.params;
    const { days = 7 } = req.query;

    // Get app usage for this child
    const usageRecords = await firestoreService.queryDocuments('appUsage', {
      where: [
        ['parentId', '==', parentId],
        ['childName', '==', childName],
      ],
    });

    // Filter to last N days and sort
    const cutoffTime = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    const recentUsage = usageRecords
      .filter(r => new Date(r.timestamp) >= cutoffTime)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Calculate daily totals
    const dailyTotals = {};
    const appTotals = {};

    recentUsage.forEach(record => {
      const day = new Date(record.timestamp).toISOString().split('T')[0];
      
      if (!dailyTotals[day]) {
        dailyTotals[day] = 0;
      }
      dailyTotals[day] += record.totalScreenTime;

      record.apps.forEach(app => {
        if (!appTotals[app.packageName]) {
          appTotals[app.packageName] = {
            packageName: app.packageName,
            appName: app.appName,
            totalTime: 0,
          };
        }
        appTotals[app.packageName].totalTime += app.totalTimeInForeground;
      });
    });

    // Convert to arrays
    const dailyData = Object.entries(dailyTotals)
      .map(([date, time]) => ({ date, totalTime: time }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topApps = Object.values(appTotals)
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 15);

    const totalScreenTime = recentUsage.reduce((sum, r) => sum + r.totalScreenTime, 0);
    const averageDaily = dailyData.length > 0 ? totalScreenTime / dailyData.length : 0;

    res.json({
      success: true,
      childName,
      days: parseInt(days),
      totalScreenTime,
      averageDaily,
      dailyData,
      topApps,
      recentRecords: recentUsage.slice(0, 10),
    });
  } catch (error) {
    logger.error(`Get child app usage error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get child app usage',
    });
  }
};

