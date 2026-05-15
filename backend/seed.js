import bcryptjs from 'bcryptjs';
import pool from './src/db/pool.js';

async function seedDatabase() {
  try {
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash('sorreda123', salt);

    await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
      ['jaysorreda4@gmail.com', passwordHash, 'Test User']
    );

    console.log('✅ Default user created: jaysorreda4@gmail.com / sorreda123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seedDatabase();