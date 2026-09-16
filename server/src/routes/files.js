const fs = require('fs/promises');
const path = require('path');
const express = require('express');
const multer = require('multer');
const { randomUUID } = require('crypto');
const jwt = require('jsonwebtoken');
const { pool, query } = require('../db');
const config = require('../config');
const { requireAuth } = require('../middleware/auth');
const { httpError } = require('../utils/http');
const { wrapFileKey, unwrapFileKey, safeFilename } = require('../utils/crypto');

const router = express.Router();

const ALLOWED_DURATIONS = new Set([10, 30, 60, 360, 720, 1440]);
const VIEWABLE_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, _file, cb) => cb(null, `${randomUUID()}.bin`),
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileBytes + 64, files: 1 },
});

function sanitizeTokenHash(value) {
  const hash = String(value || '').trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(hash)) {
    throw httpError(400, 'invalid_link', 'This link is not valid.');
  }
  return hash;
}

function sanitizeAccessCodeHash(value) {
  const hash = String(value || '').trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(hash)) {
    throw httpError(400, 'invalid_access_code', 'Please enter a valid access code.');
  }
  return hash;
}

function requireAuthOrGuest(req, res, next) {
  const authorization = String(req.headers.authorization || '');
  if (authorization.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(authorization.slice(7), config.jwtSecret);
      if (payload.type !== 'guest_file' || !payload.fileId) throw new Error('invalid guest token');
      req.guestFileId = payload.fileId;
      return next();
    } catch {
      return res.status(401).json({ message: 'Your file access session has expired. Enter the code again.' });
    }
  }
  return requireAuth(req, res, next);
}

function parseDurationMinutes(value) {
  const minutes = Number(value);
  if (!Number.isInteger(minutes)) {
    throw httpError(400, 'invalid_duration', 'Please choose how long the file should be available.');
  }
  if (ALLOWED_DURATIONS.has(minutes)) return minutes;
  if (minutes >= 1 && minutes <= 10080) return minutes;
  throw httpError(400, 'invalid_duration', 'Please choose a valid expiration time.');
}

async function markExpiredIfNeeded(fileRow) {
  if (!fileRow) return fileRow;
  if (fileRow.status !== 'active') return fileRow;
  if (new Date(fileRow.expires_at).getTime() > Date.now()) return fileRow;

  await query("UPDATE files SET status = 'expired' WHERE id = ? AND status = 'active'", [fileRow.id]);
  await query("UPDATE file_links SET status = 'expired' WHERE file_id = ? AND status = 'active'", [fileRow.id]);
  await query("UPDATE download_history SET status = 'expired' WHERE file_id = ? AND status = 'active'", [fileRow.id]);
  await deleteStoredFile(fileRow);
  return { ...fileRow, status: 'expired', encrypted_file_reference: null, storage_reference: null };
}

async function deleteStoredFile(fileRow) {
  const name = fileRow.encrypted_file_reference || fileRow.storage_reference;
  if (!name) return;
  const fullPath = path.join(config.uploadDir, path.basename(name));
  try {
    await fs.unlink(fullPath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await query(
    'UPDATE files SET encrypted_file_reference = NULL, storage_reference = NULL WHERE id = ?',
    [fileRow.id]
  );
}

function toMeta(fileRow, extras = {}) {
  return {
    id: fileRow.id,
    filename: fileRow.original_filename,
    fileSize: Number(fileRow.file_size),
    mimeType: fileRow.mime_type,
    expiresAt: fileRow.expires_at,
    status: fileRow.status,
    viewable: VIEWABLE_TYPES.has(fileRow.mime_type),
    ...extras,
  };
}

function uploadEncrypted(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    const error = httpError(400, 'file_too_large', 'This file is too large to send.');
    next(error);
  });
}

router.post('/send', requireAuth, uploadEncrypted, async (req, res, next) => {
  try {
    if (!req.file) {
      throw httpError(400, 'no_file', 'Please choose a file.');
    }

    const accessCodeHash = sanitizeAccessCodeHash(req.body.accessCodeHash);
    const originalFilename = safeFilename(req.body.originalFilename || req.file.originalname);
    const mimeType = String(req.body.mimeType || 'application/octet-stream').slice(0, 127);
    const fileSize = Number(req.body.fileSize);
    const durationMinutes = parseDurationMinutes(req.body.durationMinutes);
    const fileKeyB64 = String(req.body.fileKey || '');

    if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > config.maxFileBytes) {
      await fs.unlink(req.file.path).catch(() => {});
      throw httpError(400, 'file_too_large', 'This file is too large to send.');
    }

    let fileKey;
    try {
      fileKey = Buffer.from(fileKeyB64, 'base64');
      if (fileKey.length !== 32) throw new Error('bad key');
    } catch {
      await fs.unlink(req.file.path).catch(() => {});
      throw httpError(400, 'upload_failed', 'Unable to send this file. Please try again.');
    }

    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    const fileId = randomUUID();
    const storedName = path.basename(req.file.filename);
    const wrappedKey = wrapFileKey(fileKey);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(
        `INSERT INTO files (
          id, sender_id, receiver_id, original_filename, mime_type, file_size,
          storage_reference, encrypted_file_reference, wrapped_key, expires_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [
          fileId,
          req.user.id,
          req.user.id,
          originalFilename,
          mimeType || 'application/octet-stream',
          fileSize,
          storedName,
          storedName,
          wrappedKey,
          expiresAt,
        ]
      );
      await conn.execute(
        `INSERT INTO guest_file_access (id, file_id, access_code_hash, expires_at)
         VALUES (?, ?, ?, ?)`,
        [randomUUID(), fileId, accessCodeHash, expiresAt]
      );
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }

    res.status(201).json({
      file: toMeta({
        id: fileId,
        original_filename: originalFilename,
        file_size: fileSize,
        mime_type: mimeType,
        expires_at: expiresAt,
        status: 'active',
      }, {
      }),
    });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(error);
  }
});

router.post('/access-code', async (req, res, next) => {
  try {
    const accessCodeHash = sanitizeAccessCodeHash(req.body.accessCodeHash);
    const rows = await query(
      `SELECT f.*, sender.email AS sender_email, g.id AS guest_access_id
       FROM guest_file_access g
       JOIN files f ON f.id = g.file_id
       JOIN users sender ON sender.id = f.sender_id
       WHERE g.access_code_hash = ?
       LIMIT 1`,
      [accessCodeHash]
    );
    if (!rows.length) throw httpError(404, 'invalid_access_code', 'That access code is not valid.');

    const fileRow = await markExpiredIfNeeded(rows[0]);
    if (fileRow.status !== 'active' || !fileRow.encrypted_file_reference) {
      throw httpError(410, 'expired_link', 'This file is no longer available.');
    }

    await query('UPDATE guest_file_access SET used_at = COALESCE(used_at, ?) WHERE id = ?', [new Date(), fileRow.guest_access_id]);
    const guestAccessToken = jwt.sign({ type: 'guest_file', fileId: fileRow.id }, config.jwtSecret, {
      expiresIn: Math.max(60, Math.floor((new Date(fileRow.expires_at).getTime() - Date.now()) / 1000)),
    });
    res.json({
      file: toMeta(fileRow, { senderEmail: fileRow.sender_email, receiverEmail: null }),
      guestAccessToken,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/access', requireAuth, async (req, res, next) => {
  try {
    const tokenHash = sanitizeTokenHash(req.body.tokenHash);
    const rows = await query(
      `SELECT f.*, sender.email AS sender_email, receiver.email AS receiver_email, l.id AS link_id
       FROM file_links l
       JOIN files f ON f.id = l.file_id
       JOIN users sender ON sender.id = f.sender_id
       JOIN users receiver ON receiver.id = f.receiver_id
       WHERE l.secure_token_hash = ?
       LIMIT 1`,
      [tokenHash]
    );

    if (!rows.length) {
      throw httpError(404, 'invalid_link', 'This link is not valid.');
    }

    const fileRow = await markExpiredIfNeeded(rows[0]);
    const userId = String(req.user.id);
    const receiverId = String(fileRow.receiver_id);
    const senderId = String(fileRow.sender_id);

    if (receiverId !== userId) {
      if (senderId === userId) {
        const error = httpError(
          403,
          'sender_cannot_open',
          `This file was sent to ${fileRow.receiver_email}. Log out, then log in as that receiver to open the link.`
        );
        error.receiverEmail = fileRow.receiver_email;
        throw error;
      }
      throw httpError(403, 'unauthorized_receiver', 'You are not allowed to open this file.');
    }
    if (fileRow.status !== 'active' || !fileRow.encrypted_file_reference) {
      throw httpError(410, 'expired_link', 'This file is no longer available.');
    }

    await query(
      'UPDATE file_links SET used_at = COALESCE(used_at, ?) WHERE id = ?',
      [new Date(), fileRow.link_id]
    );

    res.json({
      file: toMeta(fileRow, {
        senderEmail: fileRow.sender_email,
        receiverEmail: fileRow.receiver_email,
      }),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/download', requireAuthOrGuest, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT f.*, sender.email AS sender_email
       FROM files f
       JOIN users sender ON sender.id = f.sender_id
       WHERE f.id = ?
       LIMIT 1`,
      [req.params.id]
    );
    if (!rows.length) {
      throw httpError(404, 'file_missing', 'This file is no longer available.');
    }

    const fileRow = await markExpiredIfNeeded(rows[0]);
    const guestAccess = req.guestFileId === fileRow.id;
    const guestRows = await query('SELECT id FROM guest_file_access WHERE file_id = ? LIMIT 1', [fileRow.id]);
    if (guestRows.length && !guestAccess) {
      throw httpError(403, 'guest_code_required', 'Enter the access code to open this file.');
    }
    if (!guestAccess && fileRow.receiver_id !== req.user.id) {
      throw httpError(403, 'unauthorized_receiver', 'You are not allowed to open this file.');
    }
    if (fileRow.status !== 'active' || !fileRow.encrypted_file_reference) {
      throw httpError(410, 'expired_link', 'This file is no longer available.');
    }

    let fileKey;
    try {
      fileKey = unwrapFileKey(fileRow.wrapped_key);
    } catch {
      throw httpError(500, 'decrypt_failed', 'Unable to open this file. The file may be invalid or unavailable.');
    }

    const storedName = path.basename(fileRow.encrypted_file_reference);
    const fullPath = path.join(config.uploadDir, storedName);
    try {
      await fs.access(fullPath);
    } catch {
      throw httpError(410, 'file_deleted', 'This file is no longer available.');
    }

    if (!guestAccess) {
      await query(
        `UPDATE download_history
         SET downloaded_at = COALESCE(downloaded_at, ?)
         WHERE file_id = ? AND receiver_id = ?`,
        [new Date(), fileRow.id, req.user.id]
      );
    }

    res.setHeader('X-File-Name', encodeURIComponent(fileRow.original_filename));
    res.setHeader('X-File-Type', fileRow.mime_type);
    res.setHeader('X-File-Key', fileKey.toString('base64'));
    res.setHeader('Access-Control-Expose-Headers', 'X-File-Name, X-File-Type, X-File-Key');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="file.bin"');
    res.sendFile(fullPath);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
