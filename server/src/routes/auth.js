const express = require('express');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const { randomUUID } = require('crypto');
const rateLimit = require('express-rate-limit');
const { query } = require('../db');
const { publicUser, httpError } = require('../utils/http');
const { setSessionCookie, clearSessionCookie, requireAuth } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait a few minutes and try again.' },
});

function validatePassword(password) {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (!/[0-9\W_]/.test(password)) {
    return 'Password must include at least one number or symbol.';
  }
  return null;
}

router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const fullName = String(req.body.fullName || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const confirmPassword = String(req.body.confirmPassword || '');
    const timezone = String(req.body.timezone || 'UTC').slice(0, 64);

    if (!fullName || fullName.length < 2 || fullName.length > 120) {
      throw httpError(400, 'invalid_name', 'Please enter your full name.');
    }
    if (!validator.isEmail(email)) {
      throw httpError(400, 'invalid_email', 'Please enter a valid email address.');
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      throw httpError(400, 'invalid_password', passwordError);
    }
    if (password !== confirmPassword) {
      throw httpError(400, 'password_mismatch', 'Passwords do not match.');
    }

    const existing = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing.length) {
      throw httpError(409, 'duplicate_email', 'An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await query(
      'INSERT INTO users (id, full_name, email, password_hash, timezone) VALUES (?, ?, ?, ?, ?)',
      [randomUUID(), fullName, email, passwordHash, timezone || 'UTC']
    );

    res.status(201).json({ message: 'Account created. Please log in.' });
  } catch (error) {
    next(error);
  }
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!validator.isEmail(email) || !password) {
      throw httpError(400, 'invalid_credentials', 'Invalid email or password.');
    }

    const rows = await query(
      'SELECT id, full_name, email, password_hash, timezone, location_permission, created_at FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    if (!rows.length) {
      throw httpError(401, 'invalid_credentials', 'Invalid email or password.');
    }

    const match = await bcrypt.compare(password, rows[0].password_hash);
    if (!match) {
      throw httpError(401, 'invalid_credentials', 'Invalid email or password.');
    }

    setSessionCookie(res, rows[0].id);
    res.json({ user: publicUser(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ message: 'Logged out.' });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
