import fs from 'fs';
import path from 'path';

// Function to read prompt from file
const readPromptFile = (filename) => {
  const promptPath = path.join(process.cwd(), 'prompts', filename);
  return fs.readFileSync(promptPath, 'utf8');
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Read the prompt from file
    const fridgePrompt = readPromptFile('fridge-scan-prompt.txt');

    // Call OpenAI Vision API to analyze the fridge photo
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: fridgePrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${image}`,
                  detail: 'low'
                }
              }
            ]
          }
        ],
        max_tokens: 150,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      console.error('OpenAI Vision API error:', response.status);
      throw new Error(`OpenAI Vision API error: ${response.status}`);
    }

    const data = await response.json();
    const detectedIngredients = data.choices[0].message.content;
    
    // Return the detected ingredients
    return res.status(200).json({
      ingredients: detectedIngredients,
      success: true
    });

  } catch (error) {
    console.error('Fridge scanning error:', error);
    
    // Return fallback message if AI fails
    return res.status(200).json({
      ingredients: "Unable to scan ingredients from photo. Please add them manually.",
      success: false
    });
  }
}