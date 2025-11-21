const mongoose = require('mongoose');

const stepsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  steps: {
    type: Number,
    required: true,
    min: 0
  },
  distanceMeters: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate entries for same day
stepsSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Steps', stepsSchema);
