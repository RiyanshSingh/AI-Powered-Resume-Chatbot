// system + user prompt builders
export function systemPrompt() {
  return "You are a helpful AI assistant for resume analysis and career-related questions.\n" +
    "- When candidate files are available, answer questions using the resume and project information provided.\n" +
    "- When no files are uploaded, provide general helpful career advice and guidance.\n" +
    "- Be concise and specific in your responses.\n" +
    "- Always be encouraging and constructive.\n" +
    "- Provide actionable insights when possible.";
}

export function userPrompt(question: string, context?: string) {
  if (context) {
    return "Here is the relevant content from the uploaded files:\n\n" +
      context + "\n\n" +
      "Based on this information, please answer the following question:\n" +
      question;
  } else {
    return "Please provide general career advice for the following question:\n" +
      question;
  }
}
