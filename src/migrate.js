const fs = require('fs');
const path = require('path');
const pool = require('./config/database');

const MIGRATIONS_TABLE = '_migrations';

const ensureMigrationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const getExecuted = async () => {
  const result = await pool.query(`SELECT filename FROM ${MIGRATIONS_TABLE} ORDER BY id`);
  return new Set(result.rows.map(r => r.filename));
};

const markExecuted = async (filename) => {
  await pool.query(`INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES ($1)`, [filename]);
};

const migrate = async () => {
  try {
    console.log('Running migrations...');

    await ensureMigrationsTable();
    const executed = await getExecuted();

    const dir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let count = 0;

    for (const file of files) {
      if (executed.has(file)) {
        console.log(`  SKIP ${file} — already executed`);
        continue;
      }

      const sql = fs.readFileSync(path.join(dir, file), 'utf-8');
      console.log(`  RUN  ${file}...`);

      await pool.query(sql);
      await markExecuted(file);
      count++;
    }

    if (count === 0) {
      console.log('All migrations up to date.');
    } else {
      console.log(`${count} migration(s) applied successfully.`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();