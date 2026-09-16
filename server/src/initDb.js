const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { seedTestUsers } = require('./seedUsers');
const config = require('./config');

async function init() {
  const schemaPath = path.join(__dirname, '../sql/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });

  await connection.changeUser({ database: config.db.database });
  await connection.query(sql);
  if (config.seedTestUsers) {
    await seedTestUsers(connection);
    console.log('Development test accounts seeded.');
  }
  await connection.end();
  console.log('Database ready.');
}

init().catch((error) => {
  console.error('Database setup failed:', error.message);
  process.exit(1);
});
