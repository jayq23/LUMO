import fs from 'fs';
import path from 'path';
import pool from './pool.js';

/**
 * Auto-migration system - Runs on server startup
 * This ensures database schema is always up-to-date without requiring manual intervention
 */

async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Initializing database schema...');

    // 1. Check if tables exist
    const tablesCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);

    if (tablesCheck.rows.length === 0) {
      console.log('📋 Creating tables from init.sql...');
      
      const initSqlPath = path.join(process.cwd(), 'src', 'db', 'init.sql');
      const initSql = fs.readFileSync(initSqlPath, 'utf8');
      
      // Split and execute statements
      const statements = initSql.split(';').filter(stmt => stmt.trim());
      for (const stmt of statements) {
        try {
          await client.query(stmt);
        } catch (err) {
          if (!err.message.includes('already exists')) {
            throw err;
          }
        }
      }
      
      console.log('✅ Tables created successfully');
    } else {
      console.log(`✅ Database tables already exist (${tablesCheck.rows.length} tables)`);
    }

    // 2. Run OAuth migration if needed
    console.log('🔄 Checking OAuth support migration...');
    
    const oauthCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'oauth_provider'
    `);

    if (oauthCheck.rows[0].count === 0) {
      console.log('📋 Adding OAuth support columns...');
      
      try {
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN oauth_provider VARCHAR(50),
          ADD COLUMN oauth_uid VARCHAR(255)
        `);
      } catch (err) {
        if (!err.message.includes('already exists')) {
          throw err;
        }
      }

      try {
        await client.query(`
          ALTER TABLE users 
          ALTER COLUMN password_hash DROP NOT NULL
        `);
      } catch (err) {
        // Column might already be nullable
      }

      try {
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_uid)
        `);
      } catch (err) {
        // Index might already exist
      }
      
      console.log('✅ OAuth columns added');
    } else {
      console.log('✅ OAuth columns already exist');
    }

    // 3. Verify schema
    const schemaCheck = await client.query(`
      SELECT table_name, COUNT(*) as column_count
      FROM information_schema.columns
      WHERE table_schema = 'public'
      GROUP BY table_name
      ORDER BY table_name
    `);

    console.log('\n📊 Database schema ready:');
    schemaCheck.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name} (${row.column_count} columns)`);
    });

    console.log('\n✨ Database initialization complete!\n');
    return true;

  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    // Don't exit - server can still run, might be a temp DB connection issue
    return false;
  } finally {
    client.release();
  }
}

export default initializeDatabase;
