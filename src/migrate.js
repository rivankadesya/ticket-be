require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
const DB_NAME = DATABASE_URL.split('/').pop();

const ensureDatabase = async () => {
  const baseUrl = DATABASE_URL.replace(`/${DB_NAME}`, '/postgres');
  const tempPool = new Pool({ connectionString: baseUrl });

  try {
    const res = await tempPool.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [DB_NAME]);
    if (res.rows.length === 0) {
      await tempPool.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`Database "${DB_NAME}" created.`);
    }
  } finally {
    await tempPool.end();
  }
};

const run = async () => {
  try {
    console.log('Running migrations...');
    await ensureDatabase();

    const pool = new Pool({ connectionString: DATABASE_URL });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Migrations up to date.');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

run();
