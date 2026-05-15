# API Documentation

## Base URL
`http://localhost:5000/api`

## Health Check

### GET /health
Test if server and database are running.

**Response:**
```json
{
  "status": "ok",
  "message": "API is running",
  "timestamp": { "now": "2026-04-24T..." }
}
```

---

## Authentication

### POST /auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2026-04-24T..."
  }
}
```

### POST /auth/login
Login user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2026-04-24T..."
  }
}
```

### GET /auth/profile/:id
Get user profile.

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2026-04-24T..."
}
```

---

## Transactions

### GET /transactions/user/:userId
Get all transactions for a user.

**Response:**
```json
[
  {
    "id": 1,
    "category": "Groceries",
    "amount": "50.00",
    "description": "Weekly shopping",
    "transaction_date": "2026-04-24",
    "type": "expense",
    "created_at": "2026-04-24T..."
  }
]
```

### POST /transactions
Create a new transaction.

**Request:**
```json
{
  "userId": 1,
  "category": "Groceries",
  "amount": 50.00,
  "description": "Weekly shopping",
  "transactionDate": "2026-04-24",
  "type": "expense"
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "category": "Groceries",
  "amount": "50.00",
  "description": "Weekly shopping",
  "transaction_date": "2026-04-24",
  "type": "expense",
  "created_at": "2026-04-24T...",
  "updated_at": "2026-04-24T..."
}
```

### PUT /transactions/:id
Update a transaction.

**Request:**
```json
{
  "category": "Food",
  "amount": 55.00,
  "description": "Updated shopping"
}
```

**Response:** Updated transaction object

### DELETE /transactions/:id
Delete a transaction.

**Response:**
```json
{
  "message": "Transaction deleted"
}
```

---

## Budgets

### GET /budgets/user/:userId
Get all budgets for a user.

**Response:**
```json
[
  {
    "id": 1,
    "category": "Groceries",
    "limit_amount": "500.00",
    "spent_amount": "250.00",
    "month": 4,
    "year": 2026,
    "created_at": "2026-04-24T..."
  }
]
```

### POST /budgets
Create a new budget.

**Request:**
```json
{
  "userId": 1,
  "category": "Groceries",
  "limitAmount": 500.00,
  "month": 4,
  "year": 2026
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "category": "Groceries",
  "limit_amount": "500.00",
  "spent_amount": "0.00",
  "month": 4,
  "year": 2026,
  "created_at": "2026-04-24T...",
  "updated_at": "2026-04-24T..."
}
```

### PUT /budgets/:id
Update a budget.

**Request:**
```json
{
  "limitAmount": 600.00
}
```

**Response:** Updated budget object

### DELETE /budgets/:id
Delete a budget.

**Response:**
```json
{
  "message": "Budget deleted"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad request (validation error)
- `401` - Unauthorized
- `404` - Not found
- `500` - Server error
