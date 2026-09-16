const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.get('/received-files', requireAuth, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT
         h.id,
         h.file_id AS fileId,
         h.filename,
         h.received_at AS receivedAt,
         h.downloaded_at AS downloadedAt,
         h.status AS historyStatus,
         f.status AS fileStatus,
         f.expires_at AS expiresAt,
         f.encrypted_file_reference AS storedFile,
         f.file_size AS fileSize,
         sender.email AS senderEmail
       FROM download_history h
       JOIN files f ON f.id = h.file_id
       JOIN users sender ON sender.id = h.sender_id
       WHERE h.receiver_id = ?
       ORDER BY h.received_at DESC`,
      [req.user.id]
    );

    const now = Date.now();
    const items = rows.map((row) => {
      const expired =
        row.fileStatus !== 'active' ||
        !row.storedFile ||
        new Date(row.expiresAt).getTime() <= now;
      return {
        id: row.id,
        fileId: row.fileId,
        filename: row.filename,
        fileSize: Number(row.fileSize),
        senderEmail: row.senderEmail,
        receivedAt: row.receivedAt,
        downloadedAt: row.downloadedAt,
        expiresAt: row.expiresAt,
        status: expired ? 'expired' : 'active',
        canDownload: !expired,
      };
    });

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
