const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  name: { type: String, required: true, trim: true },
  emoji: { type: String, default: '✅' },
  targetMinutesPerDay: { type: Number, default: 60 },
  progressMinutes: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastCompletionDate: { type: String }, // YYYY-MM-DD
  isCompletedToday: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Habit', habitSchema);
