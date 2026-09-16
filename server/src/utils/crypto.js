const crypto = require('crypto');
const config = require('../config');

// File is encrypted in the browser with Web Crypto (authenticated AES-GCM).
// A fresh random file key is generated for every file.
// The raw key is never shown in the UI and is not stored as plaintext in MySQL.
// The server immediately wraps the key with KEY_WRAP_SECRET before insert.
// If Web Crypto is missing, the client fails instead of faking protection.

function wrapFileKey(plainKey) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', config.keyWrapSecret, iv);
  const encrypted = Buffer.concat([cipher.update(plainKey), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

function unwrapFileKey(wrapped) {
  const iv = wrapped.subarray(0, 12);
  const tag = wrapped.subarray(12, 28);
  const encrypted = wrapped.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', config.keyWrapSecret, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function pathless(name) {
  return String(name || '').split(/[/\\]/).pop();
}

function safeFilename(original) {
  const base = pathless(original).replace(/[^\w.\- ()[\]]+/g, '_').slice(0, 180);
  return base || 'file';
}

module.exports = {
  wrapFileKey,
  unwrapFileKey,
  sha256Hex,
  randomToken,
  safeFilename,
};
