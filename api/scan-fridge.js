// api/scan-fridge.js - Vercel Serverless Function for Fridge Scanning

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
                text: `You are an expert at identifying food ingredients in refrigerators and pantries. Analyze this photo very carefully and list ONLY the specific food items you can clearly see and are 95%+ certain about.

CRITICAL RULES:
- ONLY list what you can actually see in the image
- Be extremely specific (e.g., "chicken breast" not "chicken", "ground beef" not "beef")
- Do NOT assume or add similar items (if you see chicken, don't add turkey or beef)
- Do NOT list generic categories - list the actual specific items visible
- Look carefully at packaging, labels, and actual food items
- If you see eggs, specify "eggs" not "protein"
- If you see specific vegetables, name them exactly

EXAMPLES OF GOOD RESPONSES:
- "chicken breast, broccoli florets, eggs, whole milk, sharp cheddar cheese"
- "ground turkey, baby spinach, roma tomatoes, greek yogurt"
- "salmon fillet, asparagus, lemons, olive oil"

EXAMPLES OF BAD RESPONSES:
- "meat, vegetables, dairy" (too generic)
- "chicken, turkey, beef" (only list what you actually see)
- "protein, greens, cheese" (be specific)

FORMAT: Simple comma-separated list of the exact items you can identify.

If you cannot clearly see specific food items, respond with: "Unable to clearly identify specific ingredients in this image."`
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