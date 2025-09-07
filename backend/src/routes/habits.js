const express = require('express');
const Habit = require('../models/Habit');

const router = express.Router();

// List habits for user
router.get('/', async (req, res) => {
  const habits = await Habit.find({ user: req.user.id }).sort('-createdAt');
  res.json(habits);
});

// Create habit
router.post('/', async (req, res) => {
  const { name, emoji, targetMinutesPerDay } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });
  const habit = await Habit.create({ user: req.user.id, name, emoji, targetMinutesPerDay });
  res.status(201).json(habit);
});

// Update progress (increment minutes or set explicitly)
router.post('/:id/progress', async (req, res) => {
  const { minutes } = req.body; // positive or negative
  const habit = await Habit.findOne({ _id: req.params.id, user: req.user.id });
  if (!habit) return res.status(404).json({ message: 'Habit not found' });

  const today = new Date().toISOString().slice(0,10);
  if (habit.lastCompletionDate !== today) {
    habit.isCompletedToday = false;
    habit.progressMinutes = Math.max(0, habit.progressMinutes); // reset handled daily by client job
  }

  habit.progressMinutes = Math.max(0, (habit.progressMinutes || 0) + (minutes || 0));
  if (!habit.isCompletedToday && habit.progressMinutes >= habit.targetMinutesPerDay) {
    habit.isCompletedToday = true;
    const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
    if (habit.lastCompletionDate === yesterday) {
      habit.streak += 1;
    } else if (!habit.lastCompletionDate) {
      habit.streak = 1;
    } else {
      habit.streak = 1; // reset streak if missed
    }
    habit.lastCompletionDate = today;
  }
  await habit.save();
  res.json(habit);
});

// Reset a habit
router.post('/:id/reset', async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.id, user: req.user.id });
  if (!habit) return res.status(404).json({ message: 'Habit not found' });
  habit.progressMinutes = 0;
  habit.isCompletedToday = false;
  await habit.save();
  res.json(habit);
});

// Delete habit
router.delete('/:id', async (req, res) => {
  const habit = await Habit.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!habit) return res.status(404).json({ message: 'Habit not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
