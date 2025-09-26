import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA8X_XYxgvG50-vON5pZDWUBlU6mQ5Bc7s",
  authDomain: "mealvibe-app.firebaseapp.com",
  projectId: "mealvibe-app",
  storageBucket: "mealvibe-app.firebasestorage.app",
  messagingSenderId: "176564882433",
  appId: "1:176564882433:web:f66ffc9e74c1bd28ee0400",
  measurementId: "G-XV1J0P06JQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

  const { action, name, email, password, diet, allergies } = req.body;

  try {
    // For single user, we'll use email as the user ID (simplified)
    const userId = email ? email.replace(/[^a-zA-Z0-9]/g, '') : "main-user";
    const userDocRef = doc(db, "users", userId);

    if (action === 'signup') {
      // Check if user already exists
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Create new user with initial data
      const newUserData = {
        id: userId,
        name: name || email?.split('@')[0] || 'User',
        email: email,
        password: password, // In production, hash this!
        savedDiet: 'None',
        savedAllergies: [],
        needsSetup: true, // Flag to show diet/allergy setup
        createdAt: new Date().toISOString()
      };

      await setDoc(userDocRef, newUserData);
      
      return res.status(200).json({
        ...newUserData,
        password: undefined // Don't send password back
      });
    }

    if (action === 'signin') {
      // Check if user exists and password matches
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        return res.status(400).json({ error: 'User not found' });
      }

      const userData = userDoc.data();
      
      // Check password (in production, hash and compare)
      if (userData.password !== password) {
        return res.status(400).json({ error: 'Invalid password' });
      }

      return res.status(200).json({
        ...userData,
        password: undefined // Don't send password back
      });
    }

    if (action === 'complete-setup') {
      // Save user preferences after diet/allergy setup
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        return res.status(400).json({ error: 'User not found' });
      }

      const userData = userDoc.data();
      const updatedData = {
        ...userData,
        savedDiet: diet || 'None',
        savedAllergies: allergies || [],
        needsSetup: false, // Setup is complete
        updatedAt: new Date().toISOString()
      };

      await setDoc(userDocRef, updatedData);
      
      return res.status(200).json({
        success: true,
        userData: {
          ...updatedData,
          password: undefined
        }
      });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error('Firebase auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}