const jwt = require('jsonwebtoken');
const config = require('../config');
const { query } = require('../db');
const { publicUser } = require('../utils/http');

const COOKIE_NAME = 'sft_session';

function setSessionCookie(res, userId) {
  const token = jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    path: '/',
  });
}

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ message: 'Please log in to continue.' });
    }
    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret);
    } catch {
      return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
    }
    const rows = await query(
      'SELECT id, full_name, email, timezone, location_permission, created_at FROM users WHERE id = ? LIMIT 1',
      [payload.sub]
    );
    if (!rows.length) {
      return res.status(401).json({ message: 'Please log in to continue.' });
    }
    req.user = publicUser(rows[0]);
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  COOKIE_NAME,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
};
