export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, name, email, password } = req.body;

  try {
    if (action === 'signup') {
      // For now, just return mock user data
      // Later you can integrate with a real database
      const userData = {
        id: Math.random().toString(36).substr(2, 9),
        name: name,
        email: email,
        savedDiet: 'None',
        savedAllergies: []
      };
      
      return res.status(200).json(userData);
      
    } else if (action === 'signin') {
      // Mock signin - returns demo user with some saved preferences
      const userData = {
        id: Math.random().toString(36).substr(2, 9),
        name: name || email.split('@')[0],
        email: email,
        savedDiet: 'Vegetarian', // Example saved diet
        savedAllergies: ['Tree nuts', 'Dairy'] // Example saved allergies
      };
      
      return res.status(200).json(userData);
    }

  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}