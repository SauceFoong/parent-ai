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

