const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Missing auth header' });
  const token = header.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function signToken(user) {
  return jwt.sign({ id: user._id, email: user.email, fullname: user.fullname }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { authMiddleware, signToken };
