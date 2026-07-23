const express = require('express');
const router = express.Router();
const { generateToken } = require('../services/pusher');
const { verifyToken } = require('../middleware/auth');

router.post('/beams-auth', verifyToken, (req, res) => {
  try {
    const token = generateToken(req.userId);
    if (!token) {
      return res.status(503).json({ message: 'Pusher Beams not configured' });
    }
    res.json(token);
  } catch (error) {
    console.error('Beams auth error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
