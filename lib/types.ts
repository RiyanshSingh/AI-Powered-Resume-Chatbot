// Type definitions for the resume chat bot
export type Chunk = {
  id: string;
  doc: string;
  source: string;
  text: string;
  embedding: number[];
};

export type SimilarResult = {
  id: string;
  source: string;
  text: string;
  score: number;
};

export type Message = {
  role: "user" | "assistant";
  text: string;
  sources?: string[];
};

export type UploadedFile = {
  name: string;
  content: string;
  type: 'resume' | 'project';
};