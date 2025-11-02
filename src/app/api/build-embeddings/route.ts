import { NextRequest, NextResponse } from "next/server";
import { buildEmbeddingIndexFromFiles } from "../../../../lib/embeddings";
import type { UploadedFile } from "../../../../lib/types";

export const runtime = "nodejs";
export const maxDuration = 60; // Increase timeout to 60 seconds for Vercel

export async function POST(req: NextRequest) {
  try {
    const { files }: { files: UploadedFile[] } = await req.json();

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Check API key before proceeding
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY not found in environment");
      return NextResponse.json(
        {
          error: "API key not configured",
          details: "GEMINI_API_KEY environment variable is not set. Please configure it in Vercel project settings.",
          hint: "Go to Vercel Dashboard > Your Project > Settings > Environment Variables and add GEMINI_API_KEY",
        },
        { status: 500 }
      );
    }

    console.log(`Building embeddings for ${files.length} files...`);
    
    // Build embeddings from uploaded files with timeout handling
    const chunks = await Promise.race([
      buildEmbeddingIndexFromFiles(files),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Embedding generation timed out after 50 seconds")), 50000)
      ),
    ]);

    console.log(`Successfully built ${chunks.length} embedding chunks`);

    return NextResponse.json({
      success: true,
      message: `Built embeddings for ${chunks.length} chunks from ${files.length} files`,
      chunksCount: chunks.length,
      filesCount: files.length,
    });
  } catch (error) {
    console.error("Error building embeddings:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Provide helpful error messages
    let userFriendlyError = "Failed to build embeddings";
    let details = errorMessage;

    if (errorMessage.includes("API key")) {
      userFriendlyError = "API key not configured";
      details = "Please set GEMINI_API_KEY in Vercel environment variables";
    } else if (errorMessage.includes("timeout")) {
      userFriendlyError = "Processing timeout";
      details = "File is too large or processing took too long. Try splitting into smaller files.";
    } else if (errorMessage.includes("embedding")) {
      userFriendlyError = "Embedding API error";
      details = "There was an issue with the Gemini embedding service. Please try again.";
    }

    return NextResponse.json(
      { 
        error: userFriendlyError,
        details: details,
        fullError: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
