// Script to list available Gemini models
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not found in .env.local");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Common model names to try
  const modelsToTry = [
    "gemini-pro",
    "gemini-1.0-pro",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
  ];

  console.log("Testing Gemini models...\n");
  const workingModels = [];
  
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      // Try a simple test
      const result = await model.generateContent("Say 'test'");
      const response = await result.response;
      const text = response.text();
      
      if (text) {
        console.log(`✅ ${modelName} - WORKS`);
        workingModels.push(modelName);
      }
    } catch (error) {
      const errorMsg = error.message || String(error);
      if (errorMsg.includes("not found") || errorMsg.includes("404")) {
        console.log(`❌ ${modelName} - Not available`);
      } else {
        console.log(`⚠️  ${modelName} - Error: ${errorMsg.split('\n')[0]}`);
      }
    }
  }
  
  console.log("\n" + "=".repeat(50));
  if (workingModels.length > 0) {
    console.log("\n✅ Working models found:");
    workingModels.forEach(m => console.log(`   - ${m}`));
    console.log(`\n💡 Update .env.local with:`);
    console.log(`   GEMINI_CHAT_MODEL=${workingModels[0]}`);
  } else {
    console.log("\n❌ No working models found. Please check your API key.");
  }
}

listModels().catch(console.error);

