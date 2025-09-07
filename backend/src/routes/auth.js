const express = require('express');
const User = require('../models/User');
const { signToken } = require('../middleware/auth');

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { fullname, email, password } = req.body;
    if (!fullname || !email || !password) return res.status(400).json({ message: 'All fields required' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });
    const user = await User.create({ fullname, email, password });
    const token = signToken(user);
    res.json({ message: 'Signup successful', token, user: { id: user._id, fullname: user.fullname, email: user.email } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    const token = signToken(user);
    res.json({ message: 'Login successful', token, user: { id: user._id, fullname: user.fullname, email: user.email } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
