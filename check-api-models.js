// Check what models are available via the REST API
require("dotenv").config({ path: ".env.local" });

async function checkAvailableModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not found");
    return;
  }

  try {
    // Try to list models using the REST API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error fetching models:", response.status, errorText);
      return;
    }
    
    const data = await response.json();
    console.log("\n📋 Available Gemini Models:\n");
    
    if (data.models && Array.isArray(data.models)) {
      // Filter models that support generateContent
      const generateModels = data.models.filter(model => 
        model.supportedGenerationMethods && 
        model.supportedGenerationMethods.includes('generateContent')
      );
      
      if (generateModels.length > 0) {
        console.log("✅ Models that support generateContent:\n");
        generateModels.forEach(model => {
          console.log(`   Name: ${model.name}`);
          console.log(`   Display Name: ${model.displayName || 'N/A'}`);
          console.log(`   Description: ${model.description || 'N/A'}`);
          console.log(`   ---`);
        });
        
        // Suggest the first one
        const suggestedModel = generateModels[0].name.split('/').pop();
        console.log(`\n💡 Suggested model: ${suggestedModel}`);
        console.log(`   Add to .env.local: GEMINI_CHAT_MODEL=${suggestedModel}`);
      } else {
        console.log("❌ No models found that support generateContent");
      }
    } else {
      console.log("Unexpected API response:", data);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

checkAvailableModels();

