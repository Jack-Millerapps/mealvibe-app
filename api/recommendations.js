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
    const { userInputs, requestType = 'initial' } = req.body;
    
    if (!userInputs) {
      return res.status(400).json({ error: 'User inputs are required' });
    }

    // Generate fallback recommendations
    const generateFallback = () => {
      const isVegetarian = userInputs.protocols?.includes('Vegetarian');
      const isVegan = userInputs.protocols?.includes('Vegan');
      
      let suggestions = [];
      if (isVegan) {
        suggestions = [
          {
            title: "Protein-Packed Lentil Bowl",
            prep: "Heat canned lentils in a pan with garlic and cumin. Serve over greens with tahini dressing and hemp seeds.",
            vibe: "Hearty • Nourishing • Plant-Based"
          },
          {
            title: "Tofu Scramble Wrap", 
            prep: "Crumble firm tofu and sauté with turmeric and nutritional yeast. Wrap in collard greens with avocado.",
            vibe: "Protein-Rich • Fresh • Satisfying"
          },
          {
            title: "Quinoa Power Bowl",
            prep: "Cook quinoa and top with chickpeas, roasted vegetables, and almond butter drizzle.",
            vibe: "Complete • Energizing • Wholesome"
          }
        ];
      } else if (isVegetarian) {
        suggestions = [
          {
            title: "Veggie Scrambled Eggs",
            prep: "Scramble eggs with spinach and mushrooms. Serve with avocado slices and everything bagel seasoning.",
            vibe: "Protein-Rich • Simple • Comforting"
          },
          {
            title: "Bean & Cheese Quesadilla",
            prep: "Mash black beans and spread on tortilla with cheese. Cook until crispy and serve with salsa.",
            vibe: "Cheesy • Warm • Satisfying"
          },
          {
            title: "Greek Yogurt Power Bowl",
            prep: "Top Greek yogurt with nuts, seeds, and berries. Drizzle with honey and add a sprinkle of granola.",
            vibe: "Creamy • Protein-Packed • Fresh"
          }
        ];
      } else {
        suggestions = [
          {
            title: "Simple Chicken Bowl",
            prep: "Pan-sear chicken breast with herbs. Serve over greens with avocado and olive oil dressing.",
            vibe: "Protein-Rich • Clean • Satisfying"
          },
          {
            title: "Salmon & Sweet Potato",
            prep: "Bake salmon fillet and roasted sweet potato cubes. Season with lemon and herbs.",
            vibe: "Omega-Rich • Nourishing • Simple"
          },
          {
            title: "Turkey & Veggie Wrap",
            prep: "Wrap sliced turkey, cucumber, and sprouts in lettuce leaves with mustard or hummus.",
            vibe: "Fresh • Lean • Light"
          }
        ];
      }

      return {
        message: "Let's find something that feels just right for you today.",
        suggestions
      };
    };

    // Combine allergies
    const allAllergies = [...(userInputs.allergies || [])];
    if (userInputs.otherAllergy?.trim()) {
      allAllergies.push(userInputs.otherAllergy.trim());
    }

    // Determine protein requirements
    const isVegetarian = userInputs.protocols?.includes('Vegetarian');
    const isVegan = userInputs.protocols?.includes('Vegan');
    
    let proteinInstruction = '';
    if (isVegan) {
      proteinInstruction = 'CRITICAL: Each recommendation MUST include plant-based protein (like beans, lentils, tofu, tempeh, nuts, seeds, quinoa, or hemp hearts).';
    } else if (isVegetarian) {
      proteinInstruction = 'CRITICAL: Each recommendation MUST include vegetarian protein (like eggs, beans, lentils, tofu, tempeh, nuts, seeds, quinoa, or dairy).';
    } else {
      proteinInstruction = 'CRITICAL: Each recommendation MUST include animal protein (like chicken, beef, fish, eggs, or turkey).';
    }

    // Read the prompt template from file
    let promptTemplate = readPromptFile('meal-recommendation-prompt.txt');

    // Replace all placeholders in the prompt
    const finalPrompt = promptTemplate
      .replace('{MOOD}', userInputs.mood?.join(', ') || 'not specified')
      .replace('{FLAVOR}', userInputs.flavor?.join(', ') || 'not specified')
      .replace('{TEMPERATURE}', userInputs.temperature?.join(', ') || 'not specified')
      .replace('{TEXTURE}', userInputs.texture?.join(', ') || 'not specified')
      .replace('{PROTOCOLS}', userInputs.protocols?.join(', ') || 'none specified')
      .replace('{ALLERGIES}', allAllergies.join(', ') || 'none specified')
      .replace('{INGREDIENTS}', userInputs.ingredients || 'none specified')
      .replace('{PROTEIN_INSTRUCTION}', proteinInstruction);

    // Try OpenAI API call
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: finalPrompt }],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        console.error('OpenAI API error:', response.status);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Clean and parse response
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsedResponse = JSON.parse(cleanedResponse);
      
      return res.status(200).json(parsedResponse);

    } catch (apiError) {
      console.error('OpenAI API error:', apiError);
      // Return fallback on API failure
      const fallback = generateFallback();
      return res.status(200).json(fallback);
    }

  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({ 
      error: 'Internal server error'
    });
  }
}