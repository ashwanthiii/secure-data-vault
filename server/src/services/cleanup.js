const fs = require('fs/promises');
const path = require('path');
const { query } = require('../db');
const config = require('../config');

async function expireAndCleanup() {
  const expired = await query(
    `SELECT id, encrypted_file_reference, storage_reference
     FROM files
     WHERE status = 'active' AND expires_at <= UTC_TIMESTAMP(3)`
  );

  if (expired.length) {
    const ids = expired.map((row) => row.id);
    const placeholders = ids.map(() => '?').join(',');
    await query(`UPDATE files SET status = 'expired' WHERE id IN (${placeholders})`, ids);
    await query(`UPDATE file_links SET status = 'expired' WHERE file_id IN (${placeholders}) AND status = 'active'`, ids);
    await query(`UPDATE download_history SET status = 'expired' WHERE file_id IN (${placeholders}) AND status = 'active'`, ids);

    for (const row of expired) {
      const name = row.encrypted_file_reference || row.storage_reference;
      if (!name) continue;
      const fullPath = path.join(config.uploadDir, path.basename(name));
      try {
        await fs.unlink(fullPath);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error('Cleanup could not remove expired file');
        }
      }
    }

    await query(
      `UPDATE files
       SET encrypted_file_reference = NULL, storage_reference = NULL
       WHERE id IN (${placeholders})`,
      ids
    );
  }

  await query(
    `UPDATE file_links SET status = 'expired' WHERE status = 'active' AND expires_at <= UTC_TIMESTAMP(3)`
  );
  await query(
    `UPDATE download_history h
     JOIN files f ON f.id = h.file_id
     SET h.status = 'expired'
     WHERE h.status = 'active' AND (f.status <> 'active' OR f.expires_at <= UTC_TIMESTAMP(3))`
  );
}

function startCleanupJob() {
  expireAndCleanup().catch((error) => {
    console.error('Expiration cleanup failed', error.message);
  });
  return setInterval(() => {
    expireAndCleanup().catch((error) => {
      console.error('Expiration cleanup failed', error.message);
    });
  }, config.cleanupIntervalMs);
}

module.exports = { expireAndCleanup, startCleanupJob };
