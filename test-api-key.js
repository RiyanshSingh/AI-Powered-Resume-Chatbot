// Simple script to test API key format
require("dotenv").config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;

console.log("\n🔍 Checking API Key Configuration:\n");

if (!apiKey) {
  console.log("❌ GEMINI_API_KEY is not set in .env.local");
  process.exit(1);
}

console.log("✅ GEMINI_API_KEY is set");
console.log(`   Length: ${apiKey.length} characters`);
console.log(`   Starts with: ${apiKey.substring(0, 10)}...`);

// Check format (Google API keys typically start with "AIza" and are 39 chars)
if (apiKey.startsWith("AIza") && apiKey.length >= 35) {
  console.log("✅ API key format looks correct");
} else {
  console.log("⚠️  API key format might be unusual");
  console.log("   Expected: Starts with 'AIza' and is ~39 characters");
}

// Check for common issues
if (apiKey.includes(" ")) {
  console.log("⚠️  WARNING: API key contains spaces - remove them!");
}

if (apiKey.includes('"') || apiKey.includes("'")) {
  console.log("⚠️  WARNING: API key contains quotes - remove them!");
}

if (apiKey.trim() !== apiKey) {
  console.log("⚠️  WARNING: API key has leading/trailing whitespace");
}

console.log("\n💡 Tips:");
console.log("   1. Make sure there are no spaces or quotes around the key");
console.log("   2. The key should be on one line");
console.log("   3. Format should be: GEMINI_API_KEY=AIzaSy...");
console.log("   4. Get a new key from: https://aistudio.google.com/");
console.log("\n");

