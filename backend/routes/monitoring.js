const express = require('express');
const router = express.Router();
const {
  submitActivity,
  getActivities,
  getStats,
  updateDuration,
} = require('../controllers/monitoringController');
const { protect } = require('../middleware/auth');

router.post('/activity', protect, submitActivity);
router.get('/activities', protect, getActivities);
router.get('/stats', protect, getStats);
router.put('/activity/:id/duration', protect, updateDuration);

module.exports = router;

