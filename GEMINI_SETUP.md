# Gemini API Setup Guide

## Issue: API Key Not Valid or Models Not Available

If you're getting errors like:
- "API key not valid"
- "models/gemini-pro is not found"
- "404 Not Found"

Follow these steps:

## Step 1: Get a Valid Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" in the left sidebar
4. Create a new API key or use an existing one
5. Copy the API key

## Step 2: Enable Required APIs

Make sure the following APIs are enabled in your Google Cloud project:
- Generative Language API
- Vertex AI API (if needed)

## Step 3: Update .env.local

Create or update `.env.local` in your project root:

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_CHAT_MODEL=gemini-pro
GEMINI_EMBED_MODEL=text-embedding-004
```

## Step 4: Test Your API Key

Run this command to test:
```bash
node check-api-models.js
```

Or test with a simple script:
```javascript
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
model.generateContent("Hello").then(result => {
  console.log("✅ API Key is working!");
  console.log(result.response.text());
});
```

## Common Model Names to Try

If `gemini-pro` doesn't work, try these in your `.env.local`:

- `gemini-1.0-pro`
- `gemini-1.5-flash` 
- `gemini-1.5-pro`
- `gemini-1.5-pro-latest`

## Troubleshooting

1. **"API key not valid"**: 
   - Verify the key is correct in `.env.local`
   - Make sure there are no extra spaces or quotes
   - Regenerate the key in Google AI Studio

2. **"Model not found"**: 
   - The model name might have changed
   - Check Google's documentation for current model names
   - Try the model names listed above

3. **Rate Limits**:
   - Free tier has rate limits
   - Wait a few seconds between requests
   - Consider upgrading if you need higher limits

## Getting Help

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- Check your API usage in Google Cloud Console

