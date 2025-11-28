const firestoreService = require('../services/firestoreService');
const { generateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists in Firestore
    const existingUsers = await firestoreService.queryDocuments('users', {
      where: [['email', '==', email]],
    });

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in Firestore
    const user = await firestoreService.createDocument('users', {
      email,
      password: hashedPassword,
      name,
      role: 'parent',
      children: [],
      deviceTokens: [],
      settings: {
        violenceThreshold: 0.6,
        inappropriateThreshold: 0.7,
        adultContentThreshold: 0.8,
        notificationsEnabled: true,
        monitoringEnabled: true,
      },
    });

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error(`Register error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user in Firestore
    const users = await firestoreService.queryDocuments('users', {
      where: [['email', '==', email]],
    });

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        children: user.children || [],
        settings: user.settings,
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await firestoreService.getDocument('users', req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        children: user.children || [],
        settings: user.settings,
      },
    });
  } catch (error) {
    logger.error(`Get user error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update user settings
// @route   PUT /api/auth/settings
// @access  Private
exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;

    const user = await firestoreService.getDocument('users', req.user.id);
    
    await firestoreService.updateDocument('users', req.user.id, {
      settings: { ...user.settings, ...updates },
    });

    const updatedUser = await firestoreService.getDocument('users', req.user.id);

    res.json({
      success: true,
      settings: updatedUser.settings,
    });
  } catch (error) {
    logger.error(`Update settings error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Add device token for push notifications
// @route   POST /api/auth/device-token
// @access  Private
exports.addDeviceToken = async (req, res) => {
  try {
    const { token } = req.body;

    const user = await firestoreService.getDocument('users', req.user.id);
    
    const deviceTokens = user.deviceTokens || [];
    if (!deviceTokens.includes(token)) {
      deviceTokens.push(token);
      await firestoreService.updateDocument('users', req.user.id, {
        deviceTokens,
      });
    }

    res.json({
      success: true,
      message: 'Device token added successfully',
    });
  } catch (error) {
    logger.error(`Add device token error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Add child profile
// @route   POST /api/auth/children
// @access  Private
exports.addChild = async (req, res) => {
  try {
    const { name, age, deviceId } = req.body;

    const user = await firestoreService.getDocument('users', req.user.id);
    
    const children = user.children || [];
    children.push({ name, age, deviceId });
    
    await firestoreService.updateDocument('users', req.user.id, {
      children,
    });

    const updatedUser = await firestoreService.getDocument('users', req.user.id);

    res.json({
      success: true,
      children: updatedUser.children,
    });
  } catch (error) {
    logger.error(`Add child error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
