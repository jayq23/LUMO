-- Migration: Add OAuth support to users table
-- This script updates existing users table to support OAuth login

ALTER TABLE users 
  ADD COLUMN oauth_provider VARCHAR(50),
  ADD COLUMN oauth_uid VARCHAR(255);

-- Make password_hash nullable (for OAuth users who don't have passwords)
ALTER TABLE users 
  ALTER COLUMN password_hash DROP NOT NULL;

-- Create index for OAuth lookups
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_uid);

-- Verify the changes
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';


-- Migration: Add password reset token support
-- Run this once against your Supabase/Postgres database

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_token TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users (reset_token);
