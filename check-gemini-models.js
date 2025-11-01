// Quick script to check available Gemini models
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function checkModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not found in environment");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // Try common model names
    const modelsToTry = [
      "gemini-pro",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-1.5-pro-latest",
      "gemini-1.0-pro",
    ];

    console.log("Testing available models...\n");
    
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("test");
        console.log(`✅ ${modelName} - WORKS`);
        break; // Use the first working one
      } catch (error) {
        console.log(`❌ ${modelName} - ${error.message.split('\n')[0]}`);
      }
    }
  } catch (error) {
    console.error("Error checking models:", error.message);
  }
}

checkModels();

