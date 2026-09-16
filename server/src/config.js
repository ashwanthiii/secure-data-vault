const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const keyWrapSecret = required('KEY_WRAP_SECRET');
if (!/^[0-9a-fA-F]{64}$/.test(keyWrapSecret)) {
  throw new Error('KEY_WRAP_SECRET must be 64 hex characters (32 bytes)');
}

module.exports = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'secure_file_transfer',
  },
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieSecure: String(process.env.COOKIE_SECURE).toLowerCase() === 'true',
  keyWrapSecret: Buffer.from(keyWrapSecret, 'hex'),
  maxFileBytes: Number(process.env.MAX_FILE_BYTES || 52428800),
  uploadDir: path.resolve(__dirname, '..', process.env.UPLOAD_DIR || './uploads'),
  cleanupIntervalMs: Number(process.env.CLEANUP_INTERVAL_MS || 60000),
  seedTestUsers: String(process.env.SEED_TEST_USERS).toLowerCase() === 'true',
};
