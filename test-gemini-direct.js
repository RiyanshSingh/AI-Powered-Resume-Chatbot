// Direct test of Gemini API
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

async function testAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not found");
    return;
  }

  console.log("\n🧪 Testing Gemini API Directly...\n");
  console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}\n`);

  const genAI = new GoogleGenerativeAI(apiKey);

  // Try gemini-2.5-flash (current stable)
  try {
    console.log("Testing with model: gemini-2.5-flash");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Say hello");
    const response = await result.response;
    const text = response.text();
    console.log("✅ SUCCESS! API key is working!");
    console.log(`Response: ${text}\n`);
    console.log("💡 Your setup is correct!");
    console.log("   GEMINI_CHAT_MODEL=gemini-2.5-flash\n");
    return;
  } catch (error) {
    console.log(`❌ gemini-2.5-flash failed: ${error.message.split('\n')[0]}\n`);
  }

  // Try gemini-2.5-pro as fallback
  try {
    console.log("Testing with model: gemini-2.5-pro");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result = await model.generateContent("Say hello");
    const response = await result.response;
    const text = response.text();
    console.log("✅ SUCCESS! API key is working!");
    console.log(`Response: ${text}\n`);
    console.log("💡 Use this in your .env.local:");
    console.log("   GEMINI_CHAT_MODEL=gemini-2.5-pro\n");
    return;
  } catch (error) {
    const errorMsg = error.message || String(error);
    if (errorMsg.includes("API key not valid")) {
      console.log("❌ API key is invalid or doesn't have access to Gemini API");
      console.log("\n🔧 Solutions:");
      console.log("   1. Get a new API key from: https://aistudio.google.com/");
      console.log("   2. Make sure the API key has Gemini API enabled");
      console.log("   3. Check if your Google account has access to Gemini");
    } else if (errorMsg.includes("not found") || errorMsg.includes("404")) {
      console.log("⚠️  Model not found, but API key might be valid");
      console.log("   Try checking available models");
    } else {
      console.log(`❌ Error: ${errorMsg.split('\n')[0]}`);
    }
  }
}

testAPI().catch(console.error);

