const mongoose = require('mongoose');

const heartRateSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  bpm: {
    type: Number,
    required: true,
    min: 0,
    max: 300
  },
  source: {
    type: String,
    default: 'Apple Watch'
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
heartRateSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('HeartRate', heartRateSchema);
