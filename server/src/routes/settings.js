const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { httpError, publicUser } = require('../utils/http');
const { clearSessionCookie } = require('../middleware/auth');

const router = express.Router();

function validatePassword(password) {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (!/[0-9\W_]/.test(password)) {
    return 'Password must include at least one number or symbol.';
  }
  return null;
}

router.put('/password', requireAuth, async (req, res, next) => {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');
    const confirmPassword = String(req.body.confirmPassword || '');

    if (!currentPassword) {
      throw httpError(400, 'invalid_password', 'Please enter your current password.');
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      throw httpError(400, 'invalid_password', passwordError);
    }
    if (newPassword !== confirmPassword) {
      throw httpError(400, 'password_mismatch', 'Passwords do not match.');
    }

    const rows = await query('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) {
      throw httpError(400, 'invalid_password', 'Current password is incorrect.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.user.id]);
    res.json({ message: 'Password updated.' });
  } catch (error) {
    next(error);
  }
});

router.put('/timezone', requireAuth, async (req, res, next) => {
  try {
    const timezone = String(req.body.timezone || '').slice(0, 64);
    if (!timezone) {
      throw httpError(400, 'invalid_timezone', 'Please choose a time zone.');
    }
    const locationPermission = req.body.locationPermission ? 1 : 0;
    await query(
      'UPDATE users SET timezone = ?, location_permission = ? WHERE id = ?',
      [timezone, locationPermission, req.user.id]
    );
    const rows = await query(
      'SELECT id, full_name, email, timezone, location_permission, created_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    res.json({ user: publicUser(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', requireAuth, (req, res) => {
  clearSessionCookie(res);
  res.json({ message: 'Logged out.' });
});

module.exports = router;
