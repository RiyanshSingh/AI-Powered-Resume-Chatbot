"use client";
// UI: input, chat, streaming, file upload with premium design
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DocumentPlusIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  StopIcon,
} from "@heroicons/react/24/outline";
import { Sparkles, Brain, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Message, UploadedFile } from "../../lib/types";

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [embeddingsReady, setEmbeddingsReady] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [candidateName, setCandidateName] = useState<string>("");
  const [hasIntroduced, setHasIntroduced] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Extract candidate name from resume content
  function extractCandidateName(files: UploadedFile[]): string {
    const resumeFile = files.find((f) => f.type === "resume");
    if (!resumeFile) return "the candidate";

    // Simple name extraction - look for common patterns
    const content = resumeFile.content;
    const lines = content.split("\n").slice(0, 10); // Check first 10 lines

    for (const line of lines) {
      // Look for name patterns like "# John Doe" or "John Doe - Software Engineer"
      const nameMatch =
        line.match(/^#\s*([A-Z][a-z]+ [A-Z][a-z]+)/) ||
        line.match(/^([A-Z][a-z]+ [A-Z][a-z]+)\s*[-–—]/) ||
        line.match(/^([A-Z][a-z]+ [A-Z][a-z]+)\s*$/) ||
        line.match(/Name:\s*([A-Z][a-z]+ [A-Z][a-z]+)/);

      if (nameMatch && nameMatch[1]) {
        return nameMatch[1];
      }
    }
    return "the candidate";
  }

  // Generate introduction message
  async function generateIntroMessage(name: string) {
    if (hasIntroduced) return;

    const displayName = name === "the candidate" ? "this candidate" : name;
    const introText = `Hi there! I've analyzed **${displayName}'s** résumé and project files. 

I can help you discover:
• **Technical skills** and programming languages
• **Professional experience** and career highlights  
• **Project achievements** and outcomes
• **What makes them unique** as a candidate

Ask me anything about their background, experience, or what specific skills they bring to the table!`;

    const introMessage: Message = {
      role: "assistant",
      text: introText,
      sources: ["AI Introduction"],
    };

    setMessages((prev) => [...prev, introMessage]);
    setHasIntroduced(true);

    // Auto-speak a shorter version of the introduction
    const spokenText = `Hi there! I've analyzed ${displayName}'s résumé and project files. Ask me anything about their experience, skills, or what makes them unique.`;
    if (!isSpeaking) {
      setTimeout(() => speakAnswer(spokenText), 1000);
    }
  }

  // File upload handler
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = [];
    for (const file of files) {
      if (file.name.endsWith(".md") || file.name.endsWith(".txt")) {
        const content = await file.text();
        const type = file.name.toLowerCase().includes("resume")
          ? "resume"
          : "project";
        newFiles.push({ name: file.name, content, type });
      }
    }

    const allFiles = [...uploadedFiles, ...newFiles];
    setUploadedFiles(allFiles);

    // Extract candidate name from uploaded files
    const extractedName = extractCandidateName(allFiles);
    setCandidateName(extractedName);

    // Build embeddings for uploaded files
    if (newFiles.length > 0) {
      setLoading(true);
      try {
        const response = await fetch("/api/build-embeddings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files: allFiles }),
        });
        
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.details || errorMessage;
            console.error("Failed to build embeddings:", errorData);
          } catch {
            const errorText = await response.text().catch(() => "");
            errorMessage = errorText || errorMessage;
            console.error("Failed to build embeddings (non-JSON response):", errorText);
          }
          alert(`Failed to build embeddings: ${errorMessage}`);
          setLoading(false);
          return;
        }
        
        const result = await response.json();
        console.log("Embeddings built successfully:", result);
        
        if (result.success) {
          setEmbeddingsReady(true);
          // Generate introduction message after embeddings are ready
          setTimeout(() => generateIntroMessage(extractedName), 1000);
        } else {
          throw new Error(result.error || "Failed to build embeddings");
        }
      } catch (error) {
        console.error("Failed to build embeddings:", error);
        const errorMsg = error instanceof Error ? error.message : "Failed to build embeddings";
        alert(`Error: ${errorMsg}\n\nPlease check:\n1. API key is set in Vercel\n2. Files are not too large\n3. Network connection is stable`);
        setEmbeddingsReady(false);
      } finally {
        setLoading(false);
      }
    }
  }

  // Voice input handler
  function startListening() {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported");
      return;
    }

    const recognition = new (
      window as unknown as { webkitSpeechRecognition: new () => unknown }
    ).webkitSpeechRecognition() as {
      continuous: boolean;
      interimResults: boolean;
      onresult:
        | ((event: {
            results: {
              [key: number]: { [key: number]: { transcript: string } };
            };
          }) => void)
        | null;
      onerror: ((event: unknown) => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
    };
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsListening(true);
    recognition.onresult = (event: {
      results: { [key: number]: { [key: number]: { transcript: string } } };
    }) => {
      const transcript = event.results[0][0].transcript;
      setQ(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  }

  // Text-to-speech handler
  function speakAnswer(text: string) {
    if ("speechSynthesis" in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }

  // Stop text-to-speech
  function stopSpeaking() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    
    // Allow asking even if embeddings aren't ready - will use general knowledge
    // But warn if embeddings are still being built
    if (loading && uploadedFiles.length > 0) {
      alert("Please wait for embeddings to finish building before asking questions.");
      return;
    }

    const userMsg: Message = { role: "user", text: q.trim() };
    setMessages((m) => [
      ...m,
      userMsg,
      { role: "assistant", text: "", sources: [] },
    ]);
    setQ("");
    setLoading(true);

    // Include files in request for serverless environments where embeddings don't persist
    // This allows the API to rebuild embeddings on-the-fly if needed
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        question: userMsg.text,
        files: uploadedFiles.length > 0 ? uploadedFiles : undefined, // Include files if available
      }),
    });

    if (!res.ok) {
      let errorMessage = "Failed to get response";
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        try {
          errorMessage = await res.text();
        } catch {
          errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        }
      }
      console.error("API Error:", errorMessage);
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          text: `Error: ${errorMessage}`,
          sources: [],
        };
        return copy;
      });
      setLoading(false);
      return;
    }

    if (!res.body) {
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    let sources: string[] = [];

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);

      // Check if this chunk contains source information
      if (chunk.includes("SOURCES:")) {
        const [text, sourcesStr] = chunk.split("SOURCES:");
        acc += text;
        if (sourcesStr) {
          sources = JSON.parse(sourcesStr);
        }
      } else {
        acc += chunk;
      }

      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", text: acc, sources };
        return copy;
      });
      areaRef.current?.scrollTo({
        top: areaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }

    // Auto-speak the answer
    if (acc && !isSpeaking) {
      speakAnswer(acc);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-black">
      <main className="mx-auto max-w-full px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl">
              <Brain className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent">
              AI Powered Resume Chatbot
            </h1>
          </div>

          {candidateName && candidateName !== "the candidate" ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-2"
            >
              <p className="text-gray-300 text-lg">
                Currently analyzing:{" "}
                <span className="text-cyan-300 font-semibold">
                  {candidateName}
                </span>
              </p>
              <p className="text-gray-400 text-sm">
                Ask intelligent questions about their experience and skills
              </p>
            </motion.div>
          ) : (
            <p className="text-gray-300 text-lg">
              Upload candidate files and unlock AI-powered insights with
              intelligent questioning
            </p>
          )}
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-[2fr_3fr] gap-4 min-h-[75vh]">
          {/* Left Column - File Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="scrollbar-hide bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl overflow-auto h-[75vh] flex flex-col box-border"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-3 text-white">
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg">
                <DocumentPlusIcon className="w-5 h-5 text-white" />
              </div>
              Upload Resume and Project Files
            </h2>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".md,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="flex flex-col space-y-6">
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full group border-2 border-dashed border-white/30 rounded-xl p-6 text-center hover:border-cyan-400/50 transition-all duration-300 bg-white/5 backdrop-blur-sm"
              >
                <motion.div
                  animate={{ rotate: uploadedFiles.length > 0 ? 360 : 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <DocumentPlusIcon className="w-10 h-10 mx-auto mb-3 text-cyan-300 group-hover:text-cyan-200 transition-colors" />
                </motion.div>
                <p className="text-sm text-gray-300 group-hover:text-white transition-colors mb-2">
                  Click to upload resume and project files
                </p>
                <p className="text-xs text-gray-400">
                  Supports .md and .txt formats
                </p>
              </motion.button>

              <div className="flex-1 space-y-4 min-h-0">
                <p className="text-base font-medium text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  Uploaded Files
                </p>
                {uploadedFiles.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    No files uploaded yet
                  </p>
                ) : (
                  <div className="space-y-3 overflow-auto flex-1 min-h-0 custom-scrollbar">
                    <AnimatePresence>
                      {uploadedFiles.map((file, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3, delay: i * 0.1 }}
                          className="flex items-center gap-3 text-sm bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10"
                        >
                          <span
                            className={`px-3 py-2 rounded-full text-xs font-medium ${
                              file.type === "resume"
                                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                                : "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                            }`}
                          >
                            {file.type}
                          </span>
                          <span className="text-gray-200 flex-1 font-medium">
                            {file.name}
                          </span>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
                <AnimatePresence>
                  {embeddingsReady && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2 text-sm text-emerald-400 font-medium bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20"
                    >
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      {hasIntroduced
                        ? "Intelligence Ready - Ask Away!"
                        : "Preparing introduction..."}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Chat Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden shadow-xl h-[75vh] flex flex-col"
          >
            <div
              ref={areaRef}
              className="flex-1 overflow-auto p-6 space-y-4 bg-black custom-scrollbar"
            >
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center py-12"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl mb-4">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-200 text-lg mb-2">
                    Ready for intelligent conversations
                  </p>
                  <p className="text-sm text-gray-400">
                    Upload files and discover insights through AI-powered
                    questioning
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {[
                      "What technologies does this person use?",
                      "Tell me about their recent achievements",
                      "What's their experience level?",
                    ].map((suggestion, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        onClick={() => setQ(suggestion)}
                        className="text-xs bg-white/10 text-gray-300 px-3 py-2 rounded-full hover:bg-white/20 transition-all duration-200 backdrop-blur-sm border border-white/10"
                      >
                        {suggestion}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className={`flex gap-3 ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {/* Avatar for AI */}
                    {m.role === "assistant" && (
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                    )}

                    <div
                      className={`max-w-[75%] ${
                        m.role === "user" ? "order-2" : ""
                      }`}
                    >
                      <div
                        className={`p-4 rounded-2xl shadow-lg ${
                          m.role === "user"
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white ml-auto"
                            : "bg-white/90 backdrop-blur-md text-gray-800 border border-white/20"
                        }`}
                      >
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{m.text}</ReactMarkdown>
                        </div>

                        {m.sources && m.sources.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-3 pt-3 border-t border-gray-300/30"
                          >
                            <div className="flex flex-wrap gap-1 mb-2">
                              {m.sources.map((source, idx) => (
                                <motion.button
                                  key={idx}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: idx * 0.1 }}
                                  className="px-2 py-1 text-xs rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                                >
                                  {source}
                                </motion.button>
                              ))}
                            </div>

                            <button
                              onClick={() =>
                                isSpeaking ? stopSpeaking() : speakAnswer(m.text)
                              }
                              className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              {isSpeaking ? (
                                <>
                                  <StopIcon className="w-3 h-3" />
                                  Stop
                                </>
                              ) : (
                                <>
                                  <SpeakerWaveIcon className="w-3 h-3" />
                                  Listen
                                </>
                              )}
                            </button>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Avatar for User */}
                    {m.role === "user" && (
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex justify-start gap-3"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 text-gray-700 border border-white/20 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.7, 1, 0.7],
                              }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2,
                                ease: "easeInOut",
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">
                          AI is thinking...
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input Form */}
            <div className="border-t border-white/10 bg-black/20 backdrop-blur-md p-6">
              <form onSubmit={ask} className="flex gap-3">
                <motion.button
                  type="button"
                  onClick={startListening}
                  disabled={isListening || loading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    isListening
                      ? "bg-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-500/25"
                      : "bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20"
                  }`}
                >
                  <motion.div
                    animate={isListening ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  >
                    <MicrophoneIcon
                      className={`w-5 h-5 ${
                        isListening ? "text-white" : "text-gray-300"
                      }`}
                    />
                  </motion.div>
                </motion.button>

                <div className="flex-1 relative">
                  <input
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-200"
                    placeholder="Ask intelligent questions about experience, skills, projects..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    disabled={loading}
                  />
                  {q && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                    </motion.div>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={
                    loading ||
                    !q.trim() ||
                    (uploadedFiles.length > 0 && !embeddingsReady)
                  }
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg shadow-cyan-500/25"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Ask AI
                  </span>
                </motion.button>
              </form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xs text-gray-400 mt-3 flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                Powered by AI intelligence • Answers sourced from uploaded
                files
                {uploadedFiles.length === 0 &&
                  " • Upload files to unlock insights"}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="mt-8 py-6 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-sm text-gray-400"
        >
          Made in india with ❤️ by Riyansh
        </motion.p>
      </footer>
    </div>
  );
}
