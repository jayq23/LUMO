import pool from './src/db/pool.js';

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running migration: Add OAuth support to users table...');
    
    // Check if columns already exist
    const checkQuery = `
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'oauth_provider'
    `;
    
    const checkResult = await client.query(checkQuery);
    
    if (checkResult.rows[0].count > 0) {
      console.log('✅ OAuth columns already exist. Skipping migration.');
      return;
    }
    
    // Add OAuth columns
    console.log('Adding oauth_provider and oauth_uid columns...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN oauth_provider VARCHAR(50),
      ADD COLUMN oauth_uid VARCHAR(255)
    `);
    
    // Make password_hash nullable
    console.log('Making password_hash nullable...');
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN password_hash DROP NOT NULL
    `);
    
    // Create index for OAuth lookups
    console.log('Creating OAuth index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_uid)
    `);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the changes
    const verifyQuery = `
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;
    
    const verifyResult = await client.query(verifyQuery);
    console.log('\n📊 Updated users table schema:');
    console.table(verifyResult.rows);
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
