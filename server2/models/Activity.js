const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  start: {
    type: Date,
    required: true
  },
  end: {
    type: Date,
    required: true
  },
  activityType: {
    type: String,
    required: true,
    enum: ['running', 'walking', 'cycling', 'swimming', 'yoga', 'strength_training', 'other'],
    default: 'other'
  },
  caloriesBurned: {
    type: Number,
    required: true,
    min: 0
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: 0
  },
  avgHeartRate: {
    type: Number,
    min: 0,
    max: 300
  },
  distanceMeters: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
activitySchema.index({ userId: 1, start: -1 });

module.exports = mongoose.model('Activity', activitySchema);
