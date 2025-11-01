// Get list of available models from Gemini API
require("dotenv").config({ path: ".env.local" });

async function getModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not found");
    return;
  }

  console.log("\n📋 Fetching available models...\n");

  try {
    // Try v1beta endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ Error:", data.error?.message || "Unknown error");
      if (data.error?.message?.includes("API key")) {
        console.log("\n🔧 Your API key might not be valid or doesn't have access.");
        console.log("   Get a new key from: https://aistudio.google.com/");
      }
      return;
    }
    
    if (data.models && data.models.length > 0) {
      console.log(`✅ Found ${data.models.length} models:\n`);
      
      // Filter models that support generateContent
      const chatModels = data.models.filter(m => 
        m.supportedGenerationMethods?.includes('generateContent')
      );
      
      if (chatModels.length > 0) {
        console.log("📝 Models that support generateContent (chat):\n");
        chatModels.forEach(model => {
          const modelId = model.name.replace('models/', '');
          console.log(`   ✅ ${modelId}`);
          if (model.displayName) {
            console.log(`      Display: ${model.displayName}`);
          }
        });
        
        const suggested = chatModels[0].name.replace('models/', '');
        console.log(`\n💡 Suggested: GEMINI_CHAT_MODEL=${suggested}\n`);
      } else {
        console.log("❌ No models found that support generateContent");
      }
      
      // Check for embedding models
      const embedModels = data.models.filter(m => 
        m.name.includes('embedding') || m.name.includes('embed')
      );
      
      if (embedModels.length > 0) {
        console.log("\n📝 Embedding models:\n");
        embedModels.forEach(model => {
          const modelId = model.name.replace('models/', '');
          console.log(`   ✅ ${modelId}`);
        });
      }
      
    } else {
      console.log("❌ No models returned");
    }
    
  } catch (error) {
    console.error("❌ Error fetching models:", error.message);
  }
}

getModels();

