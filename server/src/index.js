const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config');
const { pool, ensureDatabase } = require('./db');
const { errorHandler } = require('./middleware/error');
const { startCleanupJob } = require('./services/cleanup');
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const profileRoutes = require('./routes/profile');
const settingsRoutes = require('./routes/settings');

fs.mkdirSync(config.uploadDir, { recursive: true });
fs.writeFileSync(path.join(config.uploadDir, '.gitkeep'), '');

const app = express();

app.disable('x-powered-by');
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: config.clientOrigin,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);

app.use(errorHandler);

async function start() {
  try {
    await ensureDatabase();
    await pool.query('SELECT 1');
  } catch (error) {
    console.error('Cannot connect to MySQL.');
    console.error('Check MySQL is running and that DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME are correct in .env.');
    console.error(error.message);
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`Secure File Transfer API running on http://localhost:${config.port}`);
    startCleanupJob();
  });
}

start();
