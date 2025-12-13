const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many authentication attempts, please try again later.'
});
const { body, validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getDb } = require('../database/db');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const JWT_SECRET = process.env.JWT_SECRET;
// Register new user
router.post('/login', authLimiter, (req, res) => {
  // ... existing login code
});
router.post('/register', authLimiter, (req, res) => {
  // ... existing register code
});
  // ... 
router.post('/register', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters, alphanumeric and underscores only'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
  .isLength({ min: 12 })
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
  .withMessage('Password must be at least 12 characters with uppercase, lowercase, number, and special character')
], authLimiter, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { username, email, password } = req.body;
  const db = getDb();

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  // Hash password
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  // Default role to 'user' if not provided or invalid
  const userRole = 'user';

  db.run(
    'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
    [username, email, hashedPassword, userRole],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }
        return res.status(500).json({ error: 'Error creating user' });
      }

      // Generate token
      const accessToken = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '15m' }
      );
      // Generate refresh token (long-lived: 7 days)
      const refreshToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      db.run(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.id, refreshToken, expiresAt.toISOString()],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Error creating refresh token' });
          }
        }
      );
      res.json({
        message: 'User registered successfully',
        accessToken,
        refreshToken,
        user: { id: user.id, username: user.username, email: user.email, role: user.role }
      });
    }
  );
});
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  // Verify refresh token exists and is valid
  db.get(
    'SELECT user_id, expires_at FROM refresh_tokens WHERE token = ?',
    [refreshToken],
    (err, tokenRecord) => {
      if (err || !tokenRecord) {
        return res.status(403).json({ error: 'Invalid refresh token' });
      }

      // Check if token expired
      if (new Date(tokenRecord.expires_at) < new Date()) {
        // Delete expired token
        db.run('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
        return res.status(403).json({ error: 'Refresh token expired' });
      }

      // Get user info
      db.get(
        'SELECT id, username, role FROM users WHERE id = ?',
        [tokenRecord.user_id],
        (err, user) => {
          if (err || !user) {
            return res.status(500).json({ error: 'Error fetching user' });
          }

          // Generate new access token
          const accessToken = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '15m' }
          );

          res.json({ accessToken });
        }
      );
    }
  );
});
// Login
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
],(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { username, password } = req.body;
  const db = getDb();

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ? OR email = ?',
    [username, username],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Compare password
      const isValidPassword = bcrypt.compareSync(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    }
  );
});

// Get current user info
router.get('/me', authenticateToken, (req, res) => {
  const db = getDb();
  db.get(
    'SELECT id, username, email, role FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ user });
    }
  );
});

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

module.exports = router;
module.exports.authenticateToken = authenticateToken;

