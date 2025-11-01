# Quick Start — Resume Chat Bot

This quick-start guide walks you through everything you need to get this project running locally and deployed to Vercel. It covers prerequisites, GitHub setup, local development, environment variables, building embeddings, and basic deployment instructions.

---

## Prerequisites

- Node.js (recommended LTS 18+ or newer compatible with Next 15). Install from https://nodejs.org/.
- npm (bundled with Node) or pnpm/yarn if you prefer.
- An OpenAI API key. You can get one from https://platform.openai.com/.
- Git and a GitHub account.
- (Optional) Vercel account for deployment.

---

## 1) Clone the repository and install dependencies

Open a terminal (zsh on macOS) and run:

```bash
git clone <your-repo-ssh-or-https-url>
cd resume-chat-bot
npm install
```

If you forked the project on GitHub, replace the clone URL with your fork's URL. If you don't have a repository yet, create one on GitHub and push your local copy.

---

## 2) Set environment variables

Create a `.env.local` file at the project root (this file should NOT be committed). Add your OpenAI key and optional model overrides:

```bash
# .env.local
OPENAI_API_KEY=sk-...your-key-here
# Optional
OPENAI_EMBED_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4o-mini
```

Alternatively, you can export the key in your zsh session for a single terminal session:

```bash
export OPENAI_API_KEY=sk-...your-key-here
```

---

## 3) Build embeddings from sample data (optional)

If you want to pre-build embeddings from the example documents in `data/` (useful for offline demos):

```bash
npm run build-embeddings
```

This script uses the OpenAI Embeddings API and will create `embeddings.json` in the project root.

Note: Running this consumes OpenAI credits.

---

## 4) Run the dev server

Start the Next.js dev server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser. You can upload `.md` or `.txt` files and ask questions.

---

## 5) Uploading files in the UI (how it works)

- Use the file upload button in the left pane to select `.md` or `.txt` files.
- The client will POST file contents to `/api/build-embeddings`, which builds an in-memory embedding index for the session.
- After embeddings are ready you can ask questions; the client then POSTs to `/api/ask`, which performs retrieval and streams the AI answer back.

---

## 6) Tests (optional)

If test files are added for retrieval utilities, run the test runner you choose (e.g., `vitest`), or run simple Node-based scripts. For example, if using `vitest`:

```bash
npm run test
```

(There aren't tests included by default — you can add them using the prompts in `prompts/project_generation_prompts.md`.)

---

## 7) GitHub setup (recommended workflow)

1. Create a repository on GitHub (if you haven't already).
2. In your local project:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

3. Use feature branches for changes and open pull requests for review.

---

## 8) Deploying to Vercel

This project is built for deployment on Vercel. Steps:

1. Sign in to https://vercel.com/ and create a new project.
2. Connect your GitHub repository.
3. In the Vercel project settings, add the environment variables (e.g., `OPENAI_API_KEY`, optionally `OPENAI_EMBED_MODEL`, `OPENAI_CHAT_MODEL`).
4. Deploy — Vercel will run `npm install` and build the project automatically.

Important notes for streaming endpoints:
- Streaming chat completions and long-running Nodejs functions may require the Node runtime. The project's `src/app/api/ask/route.ts` already sets `export const runtime = "nodejs";` to request Node in Next.js. Vercel supports Node runtimes for serverless functions, but make sure your plan supports the required execution model. If streaming fails on a strict edge runtime, Vercel logs will indicate the cause.

---

## 9) Security and privacy

- Candidate files (resumes/projects) should not be committed to Git. Keep them local or behind access controls.
- Do not commit `.env.local` or any secrets to the repository.
- Limit access to the OpenAI API key and rotate keys periodically.

---

## 10) Troubleshooting

- If the dev server won't start, ensure Node and npm versions are compatible with the project's `package.json`.
- If embeddings fail to build, check your `OPENAI_API_KEY` and rate limits. Try smaller batches or wait and retry.
- If streaming responses are not showing, confirm the API route runs in Node runtime and check server logs for errors.

---

## 11) Next steps and improvements

- Persist embeddings in a vector database (Pinecone, Weaviate, or SQLite vector extension) for multi-session persistence.
- Add authentication and private storage for candidate files.
- Add PDF parsing support for uploaded resumes.
- Add more robust chunking and metadata (timestamps, document sections).

---

If you'd like, I can:
- Add a `README.md` based on this Quick Start.
- Create a Vercel deployment checklist with screenshots.
- Run the project generation prompts to scaffold any missing files in this repo now.

Tell me which you'd like next.