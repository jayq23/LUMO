#!/bin/bash

# Setup script for Expense Tracker Database
# Run this after PostgreSQL.app is started

echo "🔄 Creating database..."
createdb expensetracker

echo "📊 Initializing schema..."
psql expensetracker < src/db/init.sql

echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "  1. npm run dev"
echo "  2. Test: curl http://localhost:5000/api/health"
