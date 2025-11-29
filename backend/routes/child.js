const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const childController = require('../controllers/childController');

// Public routes (for child device)
router.post('/link', childController.linkDevice);
router.post('/heartbeat', childController.sendHeartbeat);

// Protected routes (require parent auth)
router.get('/devices', protect, childController.getLinkedDevices);
router.post('/generate-code', protect, childController.generatePairingCode);
router.delete('/devices/:deviceId', protect, childController.unlinkDevice);
router.get('/status', childController.checkStatus);
router.get('/settings', childController.getSettings);

module.exports = router;

