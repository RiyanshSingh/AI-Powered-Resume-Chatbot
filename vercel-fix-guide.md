# Vercel Deployment Fix Guide

## Critical Issue: Embeddings Not Persisting

In Vercel (serverless), each API route call is a separate function invocation. This means:
- Files written to `/tmp` don't persist between requests
- Global memory doesn't persist between different API route calls
- Embeddings built in `/api/build-embeddings` won't be available in `/api/ask`

## ✅ Solution Implemented: On-the-Fly Embedding Building

The code now automatically rebuilds embeddings in the `/api/ask` route if:
1. No embeddings are found in memory/files
2. Files are provided with the request

This ensures embeddings are always available for questions, even in serverless environments.

## Alternative Solutions (For Future Optimization)

### Option 1: Use an External Database/Cache (Recommended for Scale)

Store embeddings in:
- **Redis** (Vercel KV, Upstash)
- **Database** (PostgreSQL, MongoDB)
- **Object Storage** (Vercel Blob, AWS S3)

### Option 2: Use Pre-built Embeddings

Build embeddings from the `data/` directory during build time and commit `embeddings.json`.

## Required Vercel Configuration

### 1. Environment Variables

Go to: **Vercel Dashboard > Your Project > Settings > Environment Variables**

Add these variables:
```
GEMINI_API_KEY=your_api_key_here
GEMINI_CHAT_MODEL=gemini-2.5-flash
GEMINI_EMBED_MODEL=text-embedding-004
```

**Important:** After adding environment variables, you MUST redeploy:
- Go to Deployments tab
- Click "..." on latest deployment
- Select "Redeploy"

### 2. Function Timeout

The API routes now have `maxDuration = 60` set, which should be sufficient for most cases.

### 3. Check Function Logs

In Vercel Dashboard > Your Project > Functions tab, check logs for errors:
- API key not found
- Timeout errors
- Embedding API errors

## Troubleshooting

### "Failed to build embeddings"
1. Check Vercel environment variables are set correctly
2. Verify API key is valid
3. Check function logs in Vercel dashboard
4. Ensure files aren't too large (try smaller test files)

### "AI chatbot goes into turn off mode"
This happens when `embeddingsReady` is set to `false` after an error. The fix now properly resets this state.

### Embeddings Not Persisting Between Requests
This is expected in serverless. Solutions:
1. Use external storage (Redis/Database)
2. Re-upload files when needed
3. Use pre-built embeddings from `data/` directory

## Quick Test

After deploying to Vercel:
1. Check environment variables are set
2. Upload a small test file
3. Check Vercel function logs for errors
4. Try asking a question

If it still fails, check the error message - it should now provide specific guidance.

