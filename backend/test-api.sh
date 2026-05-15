#!/bin/bash

# API Testing Script
# Run this after the server is running on port 5000

BASE_URL="http://localhost:5000/api"

echo "🧪 Testing Expense Tracker API"
echo ""

# Health Check
echo "1️⃣ Testing health endpoint..."
curl -X GET "$BASE_URL/health" | jq .
echo ""

# Register User
echo "2️⃣ Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }')

echo "$REGISTER_RESPONSE" | jq .
USER_ID=$(echo "$REGISTER_RESPONSE" | jq '.user.id')
echo "Registered user ID: $USER_ID"
echo ""

# Login
echo "3️⃣ Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

echo "$LOGIN_RESPONSE" | jq .
echo ""

# Get Profile
echo "4️⃣ Getting user profile..."
curl -s -X GET "$BASE_URL/auth/profile/$USER_ID" | jq .
echo ""

# Update Profile
echo "4️⃣.5️⃣ Updating user profile..."
curl -s -X PUT "$BASE_URL/auth/profile/$USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test User",
    "email": "updated@example.com"
  }' | jq .
echo ""

# Change Password
echo "4️⃣.6️⃣ Changing password..."
curl -s -X PUT "$BASE_URL/auth/password/$USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "password123",
    "newPassword": "newpassword456"
  }' | jq .
echo ""

# Create Transaction
echo "5️⃣ Creating transaction..."
TRANSACTION_RESPONSE=$(curl -s -X POST "$BASE_URL/transactions" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": $USER_ID,
    \"category\": \"Groceries\",
    \"amount\": 45.50,
    \"description\": \"Weekly groceries\",
    \"transactionDate\": \"2026-04-24\",
    \"type\": \"expense\"
  }")

echo "$TRANSACTION_RESPONSE" | jq .
TRANSACTION_ID=$(echo "$TRANSACTION_RESPONSE" | jq '.id')
echo ""

# Get Transactions
echo "6️⃣ Getting all transactions..."
curl -s -X GET "$BASE_URL/transactions/user/$USER_ID" | jq .
echo ""

# Create Budget
echo "7️⃣ Creating budget..."
BUDGET_RESPONSE=$(curl -s -X POST "$BASE_URL/budgets" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": $USER_ID,
    \"category\": \"Groceries\",
    \"limitAmount\": 500.00,
    \"month\": 4,
    \"year\": 2026
  }")

echo "$BUDGET_RESPONSE" | jq .
BUDGET_ID=$(echo "$BUDGET_RESPONSE" | jq '.id')
echo ""

# Get Budgets
echo "8️⃣ Getting all budgets..."
curl -s -X GET "$BASE_URL/budgets/user/$USER_ID" | jq .
echo ""

# Test Delete Account - Create a temporary user first
echo "9️⃣ Testing delete account (with temporary user)..."
DELETE_USER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "temp@example.com",
    "password": "temppass123",
    "name": "Temporary User"
  }')

DELETE_USER_ID=$(echo "$DELETE_USER_RESPONSE" | jq '.user.id')
echo "Created temporary user ID: $DELETE_USER_ID"

curl -s -X DELETE "$BASE_URL/auth/account/$DELETE_USER_ID" | jq .
echo ""

echo "✅ API testing complete!"
