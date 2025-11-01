// API: retrieve + prompt + model + stream
// /app/api/ask/route.ts
import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { loadEmbeddingIndex } from "../../../../lib/embeddings";
import { topK } from "../../../../lib/retrieve";
import { systemPrompt, userPrompt } from "../../../../lib/prompt";

export const runtime = "nodejs"; // or "edge" if you prefer

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    if (!question || typeof question !== "string") {
      return new Response("Invalid question", { status: 400 });
    }

    // Get API key from environment
    const apiKey =
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY not found in process.env");
      console.error(
        "Available env vars:",
        Object.keys(process.env).filter((k) => k.includes("GEMINI"))
      );
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY environment variable is not set. Please check your .env.local file.",
          hint: "Get your API key from https://aistudio.google.com/",
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const embedModel =
      process.env.GEMINI_EMBED_MODEL || "text-embedding-004";
    // Use gemini-2.5-flash which is the current stable model
    const chatModel = process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";

    // 1) Try to load embeddings, handle case when none available
    let hits: Array<{
      id: string;
      source: string;
      text: string;
      score: number;
    }> = [];
    let hasEmbeddings = false;

    try {
      const index = loadEmbeddingIndex();
      console.log(`Loaded embedding index with ${index.length} chunks`);

      // 2) embed query if we have embeddings
      // Use REST API for embeddings
      const embedResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${embedModel}:embedContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: {
              parts: [{ text: question }],
            },
          }),
        }
      );
      
      if (!embedResponse.ok) {
        const errorText = await embedResponse.text();
        console.error("Embedding API error:", embedResponse.status, errorText);
        throw new Error(`Embedding API error: ${embedResponse.statusText} - ${errorText}`);
      }
      
      const embedData = await embedResponse.json();
      const qVec = embedData.embedding?.values;
      
      if (!qVec || !Array.isArray(qVec)) {
        console.error("Invalid embedding response:", embedData);
        throw new Error("Invalid embedding response format");
      }

      // 3) retrieve relevant chunks
      hits = topK(qVec, index, 5);
      hasEmbeddings = hits.length > 0;
    } catch (error) {
      // No embeddings available, we'll answer without context
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn("Embedding retrieval failed, proceeding without context:", errorMsg);
      
      // Check if it's a "no embeddings" error vs a real error
      if (errorMsg.includes("No embeddings available")) {
        console.log("No embeddings file found. User needs to upload files first.");
      }
      
      hasEmbeddings = false;
      hits = [];
    }

    // 4) prompt
    const sys = systemPrompt();
    const context = hasEmbeddings
      ? hits.map((h) => `[${h.source}] ${h.text}`).join("\n\n")
      : undefined;
    const usr = hasEmbeddings
      ? userPrompt(question, context)
      : userPrompt(question);

    // Combine system and user prompts for Gemini (it doesn't have separate system messages)
    const fullPrompt = `${sys}\n\n${usr}`;

    // 5) stream
    const model = genAI.getGenerativeModel({ 
      model: chatModel,
      generationConfig: {
        temperature: 0.2,
      },
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const result = await model.generateContentStream(fullPrompt);
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              controller.enqueue(encoder.encode(chunkText));
            }
          }
          // Append sources at the end in a special format
          const sources = hasEmbeddings
            ? hits.map((h) => h.source)
            : ["General AI Knowledge"];
          controller.enqueue(
            encoder.encode(`SOURCES:${JSON.stringify(sources)}`)
          );
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          let errorMessage = "Unknown streaming error";
          if (error instanceof Error) {
            errorMessage = error.message;
            // If it's a model not found error, suggest alternatives
            if (errorMessage.includes("not found") || errorMessage.includes("404")) {
              errorMessage = `Model "${chatModel}" not available. Please update GEMINI_CHAT_MODEL in .env.local to one of: gemini-pro, gemini-1.0-pro, or check available models.`;
            }
          }
          controller.enqueue(encoder.encode(`\n\nError: ${errorMessage}`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e: unknown) {
    console.error("API route error:", e);
    const errorMessage =
      e instanceof Error ? e.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage, details: String(e) }),
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
