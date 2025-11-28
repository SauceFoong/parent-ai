const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  role: {
    type: String,
    enum: ['parent', 'admin'],
    default: 'parent',
  },
  deviceTokens: [{
    type: String,
  }],
  children: [{
    name: String,
    age: Number,
    deviceId: String,
  }],
  settings: {
    violenceThreshold: {
      type: Number,
      default: 0.6,
      min: 0,
      max: 1,
    },
    inappropriateThreshold: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 1,
    },
    adultContentThreshold: {
      type: Number,
      default: 0.8,
      min: 0,
      max: 1,
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
    monitoringEnabled: {
      type: Boolean,
      default: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

