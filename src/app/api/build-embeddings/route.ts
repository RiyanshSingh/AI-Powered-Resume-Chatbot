import { NextRequest, NextResponse } from "next/server";
import { buildEmbeddingIndexFromFiles } from "../../../../lib/embeddings";
import type { UploadedFile } from "../../../../lib/types";

export async function POST(req: NextRequest) {
  try {
    const { files }: { files: UploadedFile[] } = await req.json();

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    console.log(`Building embeddings for ${files.length} files...`);
    
    // Build embeddings from uploaded files
    const chunks = await buildEmbeddingIndexFromFiles(files);

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
    return NextResponse.json(
      { 
        error: "Failed to build embeddings",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
