# Project Generation Prompts — CAPE format

This file contains step-by-step CAPE-formatted prompts (Context, Ask, Parameters, Example) to generate the entire `resume-chat-bot` project from scratch. Use these prompts with a capable LLM (or a chain of LLM calls) to scaffold, implement, and test the system end-to-end.

Guidance:
- Run the prompts in order. Each prompt focuses on a single task or small cluster of tasks (scaffold, backend, embeddings, retrieval, APIs, frontend, tests, deployment).
- Replace placeholder values (like <YOUR_OPENAI_KEY>) and optional flags where appropriate.

---

## 1) Project scaffold and package manifest

Context
: We want to create a TypeScript Next.js project (App Router) that provides an AI-powered resume assistant. It will use OpenAI for embeddings and chat completions, Tailwind for UI, and should include scripts to build embeddings from sample data.

Ask
: Generate a complete `package.json`, `tsconfig.json`, minimal `next.config.ts`, and a short project README. Include necessary dependencies and devDependencies noted below. Provide an install + run script block for macOS (zsh).

Parameters
: 
- projectName: "resume-chat-bot"
- nextVersion: latest stable (Next 15+)
- reactVersion: compatible with Next
- include: openai, react-markdown, tailwindcss, framer-motion, typescript, ts-node
- scripts: dev, build, start, build-embeddings

Example
: 
- Output a JSON `package.json` and short file contents for `tsconfig.json` and `next.config.ts`, plus README snippet with commands:
```
npm install
npm run dev
```

---

## 2) Data folder & example files

Context
: The project will include a `data/` folder with sample resumes and project markdown files for local embedding builds and demos.

Ask
: Create three short sample markdown files: `example_resume.md`, `project_1.md`, and `sample-resume.md`. Each should be realistic but synthetic (no personal info) and include sections a resume typically has (Name, Summary, Experience, Skills) and a short project description with achievements.

Parameters
: length 150-450 words each; include bullet lists and headings; file names as above.

Example
: Show file content for `example_resume.md` with a fake name "Alex Taylor" and two experience items.

---

## 3) Embeddings & chunking implementation

Context
: We need robust server-side code to read files, split into chunks, call the OpenAI embeddings API, and persist or hold embeddings in memory for sessions.

Ask
: Produce a TypeScript module `lib/embeddings.ts` with these functions:
- `buildEmbeddingIndex()` — read `data/*.md`, chunk text, call embeddings API, write `embeddings.json`.
- `buildEmbeddingIndexFromFiles(files)` — accept uploaded files (name, content), build embeddings and store in a global in-memory index.
- `loadEmbeddingIndex()` — return the in-memory index if set, else read `embeddings.json` from disk.

Parameters
:
- CHUNK_SIZE default 700 characters
- embedding model param as env var `OPENAI_EMBED_MODEL`
- use `openai` JS client
- handle rate-limiting by batching inputs (batch size 50)

Example
: Provide the full TypeScript source for `lib/embeddings.ts`, including types imports from `lib/types.ts`.

---

## 4) Retrieval utilities

Context
: After embeddings exist, we must compute similarities and select top-k relevant chunks.

Ask
: Generate `lib/retrieve.ts` with a numerical stable cosine similarity and a `topK(queryVec, index, k=5)` function that returns top-k results sorted by score.

Parameters
:
- use numeric stability (tiny epsilon)
- return type should include `{ id, source, text, score }`

Example
: Provide unit-testable functions and a brief example of usage.

---

## 5) Prompt templates

Context
: Prompts should be consistent and reusable: one system prompt, one user prompt builder that optionally includes context.

Ask
: Create `lib/prompt.ts` with `systemPrompt()` and `userPrompt(question, context?)` matching the project's behavior: concise, helpful, actionable.

Parameters
: keep system instructions <= 6 lines; user prompt merges context if provided and asks the model to cite sources.

Example
: Show example outputs for a question "What technologies does this person use?" with two context chunks.

---

## 6) Types

Context
: TypeScript types are necessary for safety and shared contracts.

Ask
: Create `lib/types.ts` with `Chunk`, `SimilarResult`, `Message`, and `UploadedFile` types.

Parameters
: `Chunk` includes an `embedding: number[]` field.

Example
: Short TS file content.

---

## 7) API route: build embeddings

Context
: Browser uploads files to the server to generate embeddings for that session.

Ask
: Write the Next.js App Router API `src/app/api/build-embeddings/route.ts` that accepts POST `{ files: UploadedFile[] }`, calls `buildEmbeddingIndexFromFiles`, and returns JSON success or error.

Parameters
: Validate inputs; return helpful messages and HTTP codes (400 for bad input, 500 for server errors).

Example
: Provide full route handler code.

---

## 8) API route: ask (retrieval + chat + streaming)

Context
: The `/api/ask` route should accept a question, perform retrieval, call the chat model with streaming enabled, and forward a streaming response to the client including a final `SOURCES:` JSON suffix.

Ask
: Produce `src/app/api/ask/route.ts` that:
- Parses `question` from POST body.
- Loads index via `loadEmbeddingIndex()`; if present, embed the question and run `topK`.
- Build system & user messages using `lib/prompt`.
- Call `openai.chat.completions.create({ stream: true, ... })` and stream the deltas to the client via a `ReadableStream`.
- At the end, append `SOURCES:<json>` to the stream and close.

Parameters
:
- Use env vars `OPENAI_API_KEY`, `OPENAI_EMBED_MODEL`, `OPENAI_CHAT_MODEL`.
- Return `Content-Type: text/plain; charset=utf-8`.

Example
: Provide full route code with error handling.

---

## 9) Frontend: UI and streaming

Context
: Single-page client component (Next.js App Router client component) will manage file uploads, build embeddings, and ask questions.

Ask
: Create `src/app/page.tsx` as a React client component that:
- Handles file selection and POSTs files to `/api/build-embeddings`.
- Keeps uploaded files and `embeddingsReady` state.
- Submits questions to `/api/ask` and reads streaming responses via `res.body.getReader()`.
- Updates the latest assistant message incrementally.
- Shows source tags when the `SOURCES:` suffix is detected.
- Includes basic UI using Tailwind; optional icons with `lucide-react`.

Parameters
:
- Keep UI minimal but polished: two-column layout (left: uploads, right: chat), input bar, and loading indicators.
- Client-only speech-to-text via `webkitSpeechRecognition` if present and speech synthesis for answers.

Example
: Provide a simplified but functional React component; highlight the streaming loop.

---

## 10) Styling & layout

Context
: Use Tailwind; include global CSS and font imports.

Ask
: Provide a minimal `src/app/globals.css` and suggest Tailwind config snippets. Also provide `src/app/layout.tsx` that imports fonts and wraps children.

Parameters
: Keep CSS small: base background, container widths, and a few utility classes.

Example
: Code for `globals.css` and `layout.tsx`.

---

## 11) Scripts and offline embedding builder

Context
: It's helpful to have a Node script to build embeddings from `data/` offline.

Ask
: Generate `scripts/build-embeddings.ts` that imports `lib/embeddings.ts` and runs `buildEmbeddingIndex()`; include a small CLI wrapper and error handling.

Parameters
: Use `ts-node` script or `node` after TS compile; print success message and output path.

Example
: Provide script content and sample `package.json` script entry.

---

## 12) Tests for retrieval utilities

Context
: Quick unit tests help validate `cosineSim` and `topK`.

Ask
: Create simple tests using Node's `assert` or a lightweight test runner (e.g., vitest) for `lib/retrieve.ts`.

Parameters
: include a happy-path test and an edge-case test (empty vectors or zero-length).

Example
: Provide test file content and instructions to run tests.

---

## 13) Dev environment & .env example

Context
: Users need to know how to set environment variables locally.

Ask
: Provide a `.env.example` template and instructions for macOS zsh to export `OPENAI_API_KEY`.

Parameters
: Show both `.env.local` example and `export` commands.

Example
: `.env.example` content and example terminal commands.

---

## 14) Deployment notes

Context
: Offer concise notes covering deployment (Vercel) and runtime considerations (Node runtime for streaming endpoints).

Ask
: Produce a short `DEPLOYMENT.md` section explaining how to deploy to Vercel, set environment variables, and set `runtime = "nodejs"` on streaming endpoints.

Parameters
: Mention that Node runtime is required for streaming in some setups, and include fallback behavior.

Example
: Short YAML or deployment checklist.

---

## 15) End-to-end generation prompt (meta)

Context
: We want one meta prompt that coordinates the above steps sequentially and writes files to disk.

Ask
: Create a master CAPE prompt that instructs an LLM to:
1. Scaffold the project files and `package.json`.
2. Add data samples.
3. Implement `lib/` utilities.
4. Add API routes.
5. Create the frontend UI.
6. Add tests and scripts.
7. Output a ZIP manifest listing all created files and their paths.

Parameters
: The assistant should return code blocks for each file with file paths, and where appropriate include `// FILE: path` markers.

Example
: Provide a single master prompt string that can be fed to an LLM orchestration system.

---

## Usage notes

- These prompts are intentionally prescriptive to reduce ambiguity.
- When running them against an LLM, iterate on any failing or ambiguous code by asking follow-up prompts from the list above (for example: "Regenerate `src/app/page.tsx` with a simpler streaming loop").

---

If you want, I can now:
- Run a few of the prompts locally to generate files (I can create them here in the repo).
- Produce the master meta-prompt in a single copyable block.

Tell me which you'd like next.