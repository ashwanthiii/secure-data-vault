const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const TEST_ACCOUNTS = [
  {
    fullName: 'Sender Test',
    email: 'sender@test.com',
    password: 'Sender123!',
  },
  {
    fullName: 'Receiver Test',
    email: 'receiver@test.com',
    password: 'Receiver123!',
  },
];

async function seedTestUsers(connection) {
  for (const account of TEST_ACCOUNTS) {
    const [rows] = await connection.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [account.email]);
    if (rows.length) continue;
    const passwordHash = await bcrypt.hash(account.password, 12);
    await connection.execute(
      'INSERT INTO users (id, full_name, email, password_hash, timezone) VALUES (?, ?, ?, ?, ?)',
      [randomUUID(), account.fullName, account.email, passwordHash, 'Asia/Kolkata']
    );
    console.log(`Created account ${account.email}`);
  }
}

module.exports = { seedTestUsers, TEST_ACCOUNTS };
