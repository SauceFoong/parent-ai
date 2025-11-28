const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  childName: {
    type: String,
    required: true,
  },
  deviceId: {
    type: String,
    required: true,
  },
  activityType: {
    type: String,
    enum: ['video', 'game', 'app', 'website'],
    required: true,
  },
  contentTitle: {
    type: String,
    required: true,
  },
  contentDescription: String,
  appName: String,
  url: String,
  screenshot: {
    type: String, // URL or path to screenshot
  },
  aiAnalysis: {
    isInappropriate: {
      type: Boolean,
      default: false,
    },
    violenceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    adultContentScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    inappropriateScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    detectedCategories: [String],
    summary: String,
    confidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
  },
  flagged: {
    type: Boolean,
    default: false,
  },
  notificationSent: {
    type: Boolean,
    default: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  duration: {
    type: Number, // in seconds
    default: 0,
  },
});

// Index for efficient querying
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ flagged: 1, notificationSent: 1 });

module.exports = mongoose.model('Activity', activitySchema);

