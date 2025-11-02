// make & store vectors
// /lib/embeddings.ts
import fs from "node:fs";
import path from "node:path";
import type { Chunk, UploadedFile } from "./types";

const CHUNK_SIZE = 700;

export async function buildEmbeddingIndex(): Promise<Chunk[]> {
  const dataDir = path.join(process.cwd(), "data");
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".md"));

  const docs = files.map((f) => ({
    source: f.replace(".md", ""),
    doc: fs.readFileSync(path.join(dataDir, f), "utf8"),
  }));

  // naive sentence-ish split, then group to ~CHUNK_SIZE
  const chunks: Omit<Chunk, "embedding">[] = [];
  for (const d of docs) {
    const parts = d.doc.split(/(?<=[\.\!\?])\s+/);
    let buf = "";
    for (const p of parts) {
      if ((buf + " " + p).length > CHUNK_SIZE) {
        if (buf.trim())
          chunks.push({
            id: cryptoRandomId(),
            doc: d.doc,
            source: d.source,
            text: buf.trim(),
          });
        buf = p;
      } else buf += (buf ? " " : "") + p;
    }
    if (buf.trim())
      chunks.push({
        id: cryptoRandomId(),
        doc: d.doc,
        source: d.source,
        text: buf.trim(),
      });
  }

  const apiKey =
    process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  const model = process.env.GEMINI_EMBED_MODEL || "text-embedding-004";

  // Generate embeddings using Gemini REST API
  // Process individually since batchEmbedContents may not be available
  const vectors: number[][] = [];
  const batchSize = 10; // Process 10 texts at a time to avoid rate limits
  
  console.log(`Generating embeddings for ${chunks.length} chunks...`);
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchTexts = batch.map((c) => c.text);
    
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)} (${batchTexts.length} texts)...`);
    
    // Process each text individually
    for (const text of batchTexts) {
      try {
        const embedResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: {
                parts: [{ text }],
              },
            }),
          }
        );
        
        if (!embedResponse.ok) {
          const errorText = await embedResponse.text();
          throw new Error(`Gemini embedding API error: ${embedResponse.statusText} - ${errorText}`);
        }
        
        const embedData = await embedResponse.json();
        const embeddingValues = embedData.embedding?.values;
        
        if (!embeddingValues || !Array.isArray(embeddingValues)) {
          throw new Error(`Invalid embedding response format`);
        }
        
        vectors.push(embeddingValues);
        
        // Small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error embedding text chunk:`, error);
        throw error;
      }
    }
    
    console.log(`Completed batch ${Math.floor(i / batchSize) + 1}, total vectors: ${vectors.length}`);
  }

  const indexed: Chunk[] = chunks.map((c, i) => ({
    ...c,
    embedding: vectors[i],
  }));
  fs.writeFileSync(
    path.join(process.cwd(), "embeddings.json"),
    JSON.stringify(indexed, null, 2)
  );
  return indexed;
}

// Build embeddings from uploaded files (in-memory)
export async function buildEmbeddingIndexFromFiles(
  files: UploadedFile[]
): Promise<Chunk[]> {
  const docs = files.map((f) => ({
    source: f.name.replace(/\.(md|txt)$/, ""),
    doc: f.content,
  }));

  // naive sentence-ish split, then group to ~CHUNK_SIZE
  const chunks: Omit<Chunk, "embedding">[] = [];
  for (const d of docs) {
    const parts = d.doc.split(/(?<=[\.\!\?])\s+/);
    let buf = "";
    for (const p of parts) {
      if ((buf + " " + p).length > CHUNK_SIZE) {
        if (buf.trim())
          chunks.push({
            id: cryptoRandomId(),
            doc: d.doc,
            source: d.source,
            text: buf.trim(),
          });
        buf = p;
      } else buf += (buf ? " " : "") + p;
    }
    if (buf.trim())
      chunks.push({
        id: cryptoRandomId(),
        doc: d.doc,
        source: d.source,
        text: buf.trim(),
      });
  }

  const apiKey =
    process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  const model = process.env.GEMINI_EMBED_MODEL || "text-embedding-004";

  // Generate embeddings using Gemini REST API
  // Process individually since batchEmbedContents may not be available
  const vectors: number[][] = [];
  const batchSize = 10; // Process 10 texts at a time to avoid rate limits
  
  console.log(`Generating embeddings for ${chunks.length} chunks from uploaded files...`);
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchTexts = batch.map((c) => c.text);
    
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)} (${batchTexts.length} texts)...`);
    
    // Process each text individually
    for (const text of batchTexts) {
      try {
        const embedResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: {
                parts: [{ text }],
              },
            }),
          }
        );
        
        if (!embedResponse.ok) {
          const errorText = await embedResponse.text();
          throw new Error(`Gemini embedding API error: ${embedResponse.statusText} - ${errorText}`);
        }
        
        const embedData = await embedResponse.json();
        const embeddingValues = embedData.embedding?.values;
        
        if (!embeddingValues || !Array.isArray(embeddingValues)) {
          throw new Error(`Invalid embedding response format`);
        }
        
        vectors.push(embeddingValues);
        
        // Small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error embedding text chunk:`, error);
        throw error;
      }
    }
    
    console.log(`Completed batch ${Math.floor(i / batchSize) + 1}, total vectors: ${vectors.length}`);
  }

  const indexed: Chunk[] = chunks.map((c, i) => ({
    ...c,
    embedding: vectors[i],
  }));

  // DO NOT store in global memory or shared files - this causes cross-user contamination
  // Each request should work with its own embeddings only
  // Return embeddings directly - they'll be used immediately in the same request
  console.log(`Built ${indexed.length} embeddings from uploaded files (request-scoped, not persisted)`);

  return indexed;
}

export function loadEmbeddingIndex(): Chunk[] {
  // Only load pre-built embeddings from data/ directory (embeddings.json)
  // DO NOT load user-uploaded file embeddings from global state or temp files
  // This prevents cross-user contamination - each user's files are handled per-request
  
  const p = path.join(process.cwd(), "embeddings.json");
  if (fs.existsSync(p)) {
    try {
      const data = JSON.parse(fs.readFileSync(p, "utf8"));
      console.log(`Loaded ${data.length} pre-built embeddings from embeddings.json`);
      return data;
    } catch (error) {
      console.warn("Error loading embeddings.json:", error);
    }
  }
  
  // No pre-built embeddings found - user must upload files
  throw new Error("No embeddings available. Upload files to analyze.");
}

function cryptoRandomId() {
  return (
    Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  );
}
