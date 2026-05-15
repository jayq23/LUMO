#!/bin/bash

# Find PostgreSQL.app installation
POSTGRES_PATH=$(find /Applications -name "postgres" -type f 2>/dev/null | grep -E "Postgres.app.*bin" | head -1)

if [ -z "$POSTGRES_PATH" ]; then
  echo "❌ PostgreSQL.app not found!"
  echo "Please make sure PostgreSQL.app is installed in /Applications"
  exit 1
fi

# Get the bin directory
POSTGRES_BIN=$(dirname "$POSTGRES_PATH")
export PATH="$POSTGRES_BIN:$PATH"

echo "✅ PostgreSQL found at: $POSTGRES_PATH"
echo ""

# Create database
echo "📊 Creating database 'expensetracker'..."
createdb expensetracker 2>&1 || echo "Note: Database may already exist"

echo ""
echo "📝 Initializing schema..."
psql expensetracker < src/db/init.sql

if [ $? -eq 0 ]; then
  echo "✅ Database setup complete!"
else
  echo "❌ Failed to initialize schema"
  exit 1
fi
