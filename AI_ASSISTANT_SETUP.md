# AI Assistant Setup (Groq)

The Expense Tracker includes an AI Assistant powered by Groq for asking questions about your expenses.

## Installation

### 1. Get Groq API Key (Free)
- Go to https://console.groq.com
- Sign up (free account)
- Create an API key
- Copy your key

### 2. Add to `.env` file
In `/Expensetracker/.env`, add:
```
VITE_GROQ_API_KEY=your_api_key_here
```

### 3. Restart the App
The AI Assistant will automatically detect the API key and enable the chat feature.

## Features

- **No installation needed** - Works instantly with API key
- **Fast responses** - Groq is blazingly fast (~100ms)
- **Free tier** - Generous free limits (thousands of requests)
- **Floating chat button** - Access AI on any page
- **Expense analysis** - Ask about spending patterns, totals, categories
- **Example questions**:
  - "What did I spend the most on?"
  - "Calculate my total expenses"
  - "How much did I spend on groceries?"
  - "What's my average transaction?"

## Usage

1. Click the **message bubble icon** (bottom-right) to open the chat
2. Type your question about expenses
3. Wait for AI response (usually 1-2 seconds)

## Troubleshooting

**"Groq API key not configured" error:**
- Make sure you added VITE_GROQ_API_KEY to .env file
- Check that the API key is correct
- Restart the app after adding the key

**Slow responses:**
- Check your internet connection
- Verify the API key is valid at https://console.groq.com

**Rate limited:**
- Free tier has limits - wait a few minutes and try again
- Check https://console.groq.com for quota limits

## Privacy & Cost

- ✅ Free tier with generous limits
- ✅ Only expense data sent to Groq, not your login/password
- ✅ Fast responses (Groq specializes in speed)
- 🔒 Your transaction details are processed securely

## Free Tier Limits

Default free tier includes:
- Requests per minute: 30
- Requests per day: Thousands
- No credit card required for first tier

Check https://console.groq.com for current limits.
