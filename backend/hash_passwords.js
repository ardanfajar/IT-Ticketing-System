const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:lenovom100@localhost:5432/IT_Ticketing_System',
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Checking columns in users table...");
    const colCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password'
    `);

    let passwordColumn = 'password';
    if (colCheck.rows.length === 0) {
      console.log("Column 'password' not found. Checking for 'password_hash'...");
      const hashCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash'
      `);
      if (hashCheck.rows.length === 0) {
        throw new Error("Neither 'password' nor 'password_hash' column found in users table.");
      }
      passwordColumn = 'password_hash';
    }

    console.log(`Using password column: ${passwordColumn}`);

    // Fetch all users
    const usersRes = await client.query(`SELECT id, username, ${passwordColumn} FROM users`);
    const users = usersRes.rows;

    console.log(`Found ${users.length} users to migrate.`);

    // Begin transaction
    await client.query('BEGIN');

    // If the column is named 'password', rename it to 'password_hash'
    if (passwordColumn === 'password') {
      console.log("Renaming column 'password' to 'password_hash'...");
      await client.query('ALTER TABLE users RENAME COLUMN password TO password_hash');
    }

    // Hash and update each user's password
    for (const user of users) {
      const plaintextPassword = user[passwordColumn];
      
      // If it's already a bcrypt hash (starts with $2a$ or $2b$), skip hashing
      if (plaintextPassword.startsWith('$2a$') || plaintextPassword.startsWith('$2b$')) {
        console.log(`User ${user.username} already has a hashed password. Skipping.`);
        continue;
      }

      console.log(`Hashing password for user: ${user.username}...`);
      const saltRounds = 10;
      const hash = await bcrypt.hash(plaintextPassword, saltRounds);

      await client.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [hash, user.id]
      );
    }

    await client.query('COMMIT');
    console.log("Migration completed successfully!");

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Migration failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
