import React, { useState } from 'react';
import { ChevronRight, RefreshCw, Heart, Loader2, ChevronLeft, User, Mail, Lock, Check, AlertCircle } from 'lucide-react';

const MoodEatingAssistant = () => {
  // Authentication state
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authData, setAuthData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    savedDiet: '',
    savedAllergies: []
  });
  const [authErrors, setAuthErrors] = useState({});
  const [authLoading, setAuthLoading] = useState(false);

  // Existing app state
  const [currentStep, setCurrentStep] = useState('welcome');
  const [userInputs, setUserInputs] = useState({
    mood: [],
    flavor: [],
    temperature: [],
    texture: [],
    protocols: [],
    allergies: [],
    otherAllergy: '',
    ingredients: ''
  });
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fridgePhoto, setFridgePhoto] = useState(null);
  const [scanningFridge, setScanningFridge] = useState(false);
  const [skipCamera, setSkipCamera] = useState(false);
  const [detectedIngredients, setDetectedIngredients] = useState('');

  // Configure your API endpoint here
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';
  
  // Define the step order - MOVED CAMERA TO FRONT
  const steps = ['welcome', 'camera', 'mood', 'flavor', 'temperature', 'texture', 'protocols', 'allergies', 'ingredients'];

  const moods = [
    { id: 'tired', emoji: '😴', label: 'Tired' },
    { id: 'meh', emoji: '😕', label: 'Meh / Uninspired' },
    { id: 'calm', emoji: '🧘', label: 'Calm' },
    { id: 'overwhelmed', emoji: '😩', label: 'Overwhelmed' },
    { id: 'good', emoji: '😊', label: 'Pretty good' },
    { id: 'cozy', emoji: '🌧️', label: 'Cozy / Rainy Day Mood' }
  ];

  const flavors = [
    { id: 'savory', emoji: '🍳', label: 'Savory / Salty' },
    { id: 'creamy', emoji: '🥥', label: 'Creamy / Rich' },
    { id: 'fresh', emoji: '🥗', label: 'Fresh / Crisp' },
    { id: 'warm', emoji: '🍠', label: 'Warm & Comforting' },
    { id: 'spicy', emoji: '🌶️', label: 'Bold / Spicy' },
    { id: 'surprise', emoji: '🧂', label: "I'm not sure / Surprise me" }
  ];

  const temperatures = [
    { id: 'hot', emoji: '🔥', label: 'Warm or hot' },
    { id: 'cold', emoji: '❄️', label: 'Cold or cool' },
    { id: 'any', emoji: '🤷', label: "I don't care" }
  ];

  const textures = [
    { id: 'soft', emoji: '🍜', label: 'Soft / Soupy' },
    { id: 'creamy', emoji: '🍚', label: 'Creamy' },
    { id: 'crunchy', emoji: '🥒', label: 'Crunchy' },
    { id: 'hearty', emoji: '🍗', label: 'Hearty / Meaty' },
    { id: 'smooth', emoji: '🥄', label: 'Smooth & Satisfying' },
    { id: 'unsure', emoji: '🤷', label: 'Not sure' }
  ];

  const protocols = [
    'Paleo', 'Keto', 'Whole30', 'Mediterranean', 'Low FODMAP', 'AIP', 'Vegetarian', 'Vegan', 'Low Calorie', 'High Protein', 'None'
  ];

  const allergies = [
    'Tree nuts', 'Peanuts', 'Dairy', 'Gluten', 'Eggs', 'Other'
  ];

  // Authentication functions
  const validateAuthForm = () => {
    const newErrors = {};

    if (isSignUp) {
      if (!authData.name.trim()) newErrors.name = 'Name is required';
      if (authData.password !== authData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (!authData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(authData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!authData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (authData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setAuthErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAuthSubmit = async () => {
    if (!validateAuthForm()) return;

    setAuthLoading(true);
    setAuthErrors({});
    
    try {
      // Call your auth API endpoint
      const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: isSignUp ? 'signup' : 'signin',
          name: authData.name,
          email: authData.email,
          password: authData.password
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const userData = await response.json();
      
      // Set user and pre-fill their saved preferences
      setUser(userData);
      
      // If user has saved diet/allergies, pre-populate the form
      if (userData.savedDiet) {
        setUserInputs(prev => ({
          ...prev,
          protocols: userData.savedDiet === 'None' ? [] : [userData.savedDiet],
          allergies: userData.savedAllergies || []
        }));
      }
      
      setShowAuth(false);
      
    } catch (error) {
      console.error('Auth error:', error);
      setAuthErrors({ auth: error.message });
      
      // For demo purposes, simulate successful auth
      const userData = {
        id: Math.random().toString(36).substr(2, 9),
        name: authData.name || authData.email.split('@')[0],
        email: authData.email,
        savedDiet: authData.savedDiet || 'None',
        savedAllergies: authData.savedAllergies || []
      };
      
      setUser(userData);
      setShowAuth(false);
      
    } finally {
      setAuthLoading(false);
    }
  };

  // Existing app functions (unchanged)
  const callAPI = async (requestType = 'initial') => {
    setIsLoading(true);
    setError(null);

    try {
      // Combine detected ingredients with user-entered ingredients
      const combinedIngredients = detectedIngredients 
        ? `${detectedIngredients}${userInputs.ingredients ? ', ' + userInputs.ingredients : ''}`
        : userInputs.ingredients;

      const response = await fetch(`${API_BASE_URL}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInputs: {
            ...userInputs,
            ingredients: combinedIngredients
          },
          requestType,
          userId: user?.id // Include user ID for personalized recommendations
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (requestType === 'initial') {
        setRecommendations(data);
        setCurrentStep('recommendations');
      } else {
        // For "more" requests, update only the suggestions
        setRecommendations(prev => ({
          ...prev,
          suggestions: data.suggestions
        }));
      }

    } catch (error) {
      console.error('API Error:', error);
      setError('Unable to generate recommendations. Please try again.');
      
      // Show fallback recommendations
      const fallbackMessage = userInputs.mood.length > 1 
        ? "I can sense you're feeling a mix of things right now—let's find something that honors all those feelings."
        : "Let's find something that feels just right for you today.";

      const isVegetarian = userInputs.protocols.includes('Vegetarian');
      const isVegan = userInputs.protocols.includes('Vegan');
      
      let fallbackSuggestions = [];
      if (isVegan) {
        fallbackSuggestions = [
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
        fallbackSuggestions = [
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
        fallbackSuggestions = [
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
        
      setRecommendations({
        message: fallbackMessage,
        suggestions: fallbackSuggestions
      });
      
      if (requestType === 'initial') {
        setCurrentStep('recommendations');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateRecommendations = () => {
    callAPI('initial');
  };

  const generateMoreRecommendations = () => {
    callAPI('more');
  };

  // Camera and AI Vision functions (unchanged)
  const handlePhotoCapture = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFridgePhoto(file);
      scanFridgePhoto(file);
      nextStep();
    }
  };

  const scanFridgePhoto = async (file) => {
    setScanningFridge(true);
    
    try {
      const base64 = await convertToBase64(file);
      
      const response = await fetch(`${API_BASE_URL}/scan-fridge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64
        })
      });

      if (response.ok) {
        const data = await response.json();
        setDetectedIngredients(data.ingredients || '');
        console.log('Detected ingredients:', data.ingredients);
      } else {
        console.error('Failed to scan fridge photo');
      }
    } catch (error) {
      console.error('Error scanning fridge:', error);
    } finally {
      setScanningFridge(false);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const skipCameraStep = () => {
    setSkipCamera(true);
    nextStep();
  };

  const handleSelection = (step, value) => {
    setUserInputs(prev => ({
      ...prev,
      [step]: value
    }));
  };

  const handleMultiSelection = (step, value) => {
    setUserInputs(prev => ({
      ...prev,
      [step]: prev[step].includes(value) 
        ? prev[step].filter(item => item !== value)
        : [...prev[step], value]
    }));
  };

  const nextStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    } else {
      generateRecommendations();
    }
  };

  const previousStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const restart = () => {
    setCurrentStep('welcome');
    setUserInputs({
      mood: [],
      flavor: [],
      temperature: [],
      texture: [],
      protocols: user?.savedDiet && user.savedDiet !== 'None' ? [user.savedDiet] : [],
      allergies: user?.savedAllergies || [],
      otherAllergy: '',
      ingredients: ''
    });
    setRecommendations([]);
    setError(null);
    setFridgePhoto(null);
    setScanningFridge(false);
    setSkipCamera(false);
    setDetectedIngredients('');
  };

  const signOut = () => {
    setUser(null);
    setShowAuth(true);
    setAuthData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      savedDiet: '',
      savedAllergies: []
    });
    restart();
  };

  // Authentication components
  const renderAuth = () => (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
          <Heart className="w-6 h-6 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome to MealVibe</h2>
        <p className="text-gray-600 mt-2">
          {isSignUp ? 'Create your account to save preferences' : 'Sign in to access your personalized recommendations'}
        </p>
      </div>

      <div className="space-y-6">
        {isSignUp && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={authData.name}
                onChange={(e) => setAuthData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  authErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
              />
              {authErrors.name && <p className="mt-1 text-sm text-red-600">{authErrors.name}</p>}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="email"
              value={authData.email}
              onChange={(e) => setAuthData(prev => ({ ...prev, email: e.target.value }))}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                authErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
            />
            {authErrors.email && <p className="mt-1 text-sm text-red-600">{authErrors.email}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="password"
              value={authData.password}
              onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                authErrors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your password"
            />
            {authErrors.password && <p className="mt-1 text-sm text-red-600">{authErrors.password}</p>}
          </div>
        </div>

        {isSignUp && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={authData.confirmPassword}
                onChange={(e) => setAuthData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  authErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Confirm your password"
              />
              {authErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{authErrors.confirmPassword}</p>}
            </div>
          </div>
        )}

        {authErrors.auth && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{authErrors.auth}</p>
          </div>
        )}

        <button
          onClick={handleAuthSubmit}
          disabled={authLoading}
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {authLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
        </button>

        <div className="text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setAuthErrors({});
            }}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="text-center pt-4">
          <button
            onClick={() => setShowAuth(false)}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );

  // Back button component
  const BackButton = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex <= 0 || currentStep === 'recommendations') return null;
    
    return (
      <button
        onClick={previousStep}
        className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mb-4"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Back
      </button>
    );
  };

  // User header component
  const UserHeader = () => {
    if (!user) return null;
    
    return (
      <div className="flex justify-between items-center mb-6 p-4 bg-purple-50 rounded-lg">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center mr-3">
            <User className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-purple-900">{user.name}</p>
            {user.savedDiet && user.savedDiet !== 'None' && (
              <p className="text-xs text-purple-600">{user.savedDiet} diet</p>
            )}
          </div>
        </div>
        <button
          onClick={signOut}
          className="text-purple-600 hover:text-purple-800 text-sm"
        >
          Sign Out
        </button>
      </div>
    );
  };

  const renderWelcome = () => (
    <div className="text-center space-y-6">
      <div className="mb-8">
        <Heart className="w-12 h-12 mx-auto text-purple-500 mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 mb-2">MealVibe</h1>
        <p className="text-gray-600 text-lg">
          Let's find something that feels just right for you today{user ? `, ${user.name}` : ''}
        </p>
      </div>
      <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-lg">
        <p className="text-gray-700 mb-4">
          No more staring into the fridge feeling uninspired. I'll help you discover clean, nourishing meals that match your mood and cravings.
        </p>
        <button
          onClick={nextStep}
          className="bg-purple-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors flex items-center mx-auto"
        >
          Let's Start <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );

  const renderMoodSelection = () => (
    <div className="space-y-6">
      {scanningFridge && (
        <div className="text-xs text-gray-400 text-right mb-2">
          Analyzing your fridge photo...
        </div>
      )}
      {!scanningFridge && fridgePhoto && detectedIngredients && (
        <div className="text-xs text-gray-400 text-right mb-2">
          Fridge scan complete ✓
        </div>
      )}
      
      <BackButton />
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">How are you feeling right now?</h2>
      <p className="text-gray-600 text-center mb-6">Choose all that apply</p>
      <div className="grid grid-cols-2 gap-4">
        {moods.map(mood => (
          <button
            key={mood.id}
            onClick={() => handleMultiSelection('mood', mood.id)}
            className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
              userInputs.mood.includes(mood.id) 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-3xl mb-2">{mood.emoji}</div>
            <div className="font-medium text-gray-800">{mood.label}</div>
          </button>
        ))}
      </div>
      {userInputs.mood.length > 0 && (
        <button
          onClick={nextStep}
          className="w-full bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors flex items-center justify-center"
        >
          Continue <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      )}
    </div>
  );

  const renderFlavorSelection = () => (
    <div className="space-y-6">
      {scanningFridge && (
        <div className="text-xs text-gray-400 text-right mb-2">
          Analyzing your fridge photo...
        </div>
      )}
      {!scanningFridge && fridgePhoto && detectedIngredients && (
        <div className="text-xs text-gray-400 text-right mb-2">
          Fridge scan complete ✓
        </div>
      )}
      
      <BackButton />
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">What sounds good?</h2>
      <p className="text-gray-600 text-center mb-6">Choose all that apply</p>
      <div className="grid grid-cols-2 gap-4">
        {flavors.map(flavor => (
          <button
            key={flavor.id}
            onClick={() => handleMultiSelection('flavor', flavor.id)}
            className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
              userInputs.flavor.includes(flavor.id) 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-3xl mb-2">{flavor.emoji}</div>
            <div className="font-medium text-gray-800">{flavor.label}</div>
          </button>
        ))}
      </div>
      {userInputs.flavor.length > 0 && (
        <button
          onClick={nextStep}
          className="w-full bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors flex items-center justify-center"
        >
          Continue <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      )}
    </div>
  );

  const renderTemperatureSelection = () => (
    <div className="space-y-6">
      <BackButton />
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">What temperature do you want it to be?</h2>
      <p className="text-gray-600 text-center mb-6">Choose all that apply</p>
      <div className="grid grid-cols-1 gap-4">
        {temperatures.map(temp => (
          <button
            key={temp.id}
            onClick={() => handleMultiSelection('temperature', temp.id)}
            className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
              userInputs.temperature.includes(temp.id) 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">{temp.emoji}</div>
              <div className="font-medium text-gray-800">{temp.label}</div>
            </div>
          </button>
        ))}
      </div>
      {userInputs.temperature.length > 0 && (
        <button
          onClick={nextStep}
          className="w-full bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors flex items-center justify-center"
        >
          Continue <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      )}
    </div>
  );

  const renderTextureSelection = () => (
    <div className="space-y-6">
      <BackButton />
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">What texture are you craving?</h2>
      <p className="text-gray-600 text-center mb-6">Choose all that apply</p>
      <div className="grid grid-cols-2 gap-4">
        {textures.map(texture => (
          <button
            key={texture.id}
            onClick={() => handleMultiSelection('texture', texture.id)}
            className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
              userInputs.texture.includes(texture.id) 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-3xl mb-2">{texture.emoji}</div>
            <div className="font-medium text-gray-800">{texture.label}</div>
          </button>
        ))}
      </div>
      {userInputs.texture.length > 0 && (
        <button
          onClick={nextStep}
          className="w-full bg-rose-500 text-white py-3 rounded-lg font-semibold hover:bg-rose-600 transition-colors flex items-center justify-center"
        >
          Continue <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      )}
    </div>
  );

  const renderProtocolSelection = () => (
    <div className="space-y-6">
      <BackButton />
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">Which nutritional protocols should be accounted for?</h2>
      <p className="text-gray-600 text-center mb-6">Check all that apply</p>
      {user?.savedDiet && user.savedDiet !== 'None' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
          <p className="text-purple-800 text-sm">
            ✓ Your saved diet preference ({user.savedDiet}) is automatically selected
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        {protocols.map(protocol => (
          <button
            key={protocol}
            onClick={() => handleMultiSelection('protocols', protocol)}
            className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
              userInputs.protocols.includes(protocol) 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-800">{protocol}</div>
            {user?.savedDiet === protocol && (
              <div className="text-xs text-purple-600 mt-1">Saved preference</div>
            )}
          </button>
        ))}
      </div>
      <button
        onClick={nextStep}
        className="w-full bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors flex items-center justify-center"
      >
        Continue <ChevronRight className="w-5 h-5 ml-2" />
      </button>
    </div>
  );

  const renderAllergySelection = () => (
    <div className="space-y-6">
      <BackButton />
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">What allergies or intolerances do you have?</h2>
      <p className="text-gray-600 text-center mb-6">Check all that apply</p>
      {user?.savedAllergies && user.savedAllergies.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
          <p className="text-purple-800 text-sm">
            ✓ Your saved allergies ({user.savedAllergies.join(', ')}) are automatically selected
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        {allergies.map(allergy => (
          <button
            key={allergy}
            onClick={() => handleMultiSelection('allergies', allergy)}
            className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
              userInputs.allergies.includes(allergy) 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-800">{allergy}</div>
            {user?.savedAllergies?.includes(allergy) && (
              <div className="text-xs text-purple-600 mt-1">Saved preference</div>
            )}
          </button>
        ))}
      </div>
      
      {userInputs.allergies.includes('Other') && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Please specify your other allergy or intolerance:
          </label>
          <input
            type="text"
            value={userInputs.otherAllergy}
            onChange={(e) => handleSelection('otherAllergy', e.target.value)}
            placeholder="e.g., shellfish, nightshades, etc."
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
          />
        </div>
      )}
      
      <button
        onClick={nextStep}
        className="w-full bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors flex items-center justify-center"
      >
        Continue <ChevronRight className="w-5 h-5 ml-2" />
      </button>
    </div>
  );

  const renderCameraStep = () => (
    <div className="space-y-6">
      <BackButton />
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">📸 Scan Your Fridge</h2>
      <p className="text-gray-600 text-center mb-6">Take a photo of your fridge or pantry and we'll detect available ingredients!</p>
      
      <div className="space-y-4">
        <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">📷</div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <div className="bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors inline-block">
              Take Photo of Fridge
            </div>
          </label>
        </div>
        
        <div className="text-center">
          <button
            onClick={skipCameraStep}
            className="text-gray-500 hover:text-gray-700 underline"
          >
            Skip this step
          </button>
        </div>
      </div>
    </div>
  );

  const renderIngredientInput = () => (
    <div className="space-y-6">
      {scanningFridge && (
        <div className="text-xs text-gray-400 text-right mb-2">
          Analyzing your fridge photo...
        </div>
      )}
      {!scanningFridge && fridgePhoto && detectedIngredients && (
        <div className="text-xs text-gray-400 text-right mb-2">
          Fridge scan complete ✓
        </div>
      )}
      
      <BackButton />
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">Any ingredients you have on-hand that sound good?</h2>
      <p className="text-gray-600 text-center mb-6">
        Optional - help us personalize your suggestions
        {detectedIngredients && <><br/><span className="text-sm text-green-600">We've already detected ingredients from your fridge photo!</span></>}
      </p>
      <textarea
        value={userInputs.ingredients}
        onChange={(e) => handleSelection('ingredients', e.target.value)}
        placeholder="e.g., avocados, leftover chicken, sweet potatoes..."
        className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
        rows="4"
      />
      <button
        onClick={nextStep}
        disabled={isLoading}
        className="w-full bg-rose-500 text-white py-3 rounded-lg font-semibold hover:bg-rose-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Generating Recommendations...
          </>
        ) : (
          <>
            Get My Recommendations <ChevronRight className="w-5 h-5 ml-2" />
          </>
        )}
      </button>
    </div>
  );

  const renderRecommendations = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Perfect! Here are your recommendations</h2>
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-yellow-800 text-sm">{error}</p>
          </div>
        )}
        <p className="text-gray-600 bg-purple-50 p-4 rounded-lg italic">
          {recommendations.message}
        </p>
      </div>
      
      <div className="space-y-6">
        {recommendations.suggestions?.map((suggestion, index) => (
          <div key={index} className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{suggestion.title}</h3>
            <div className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              {suggestion.vibe}
            </div>
            <p className="text-gray-700 leading-relaxed">{suggestion.prep}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={generateMoreRecommendations}
          disabled={isLoading}
          className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5 mr-2" />
          )}
          Show Me More
        </button>
        <button
          onClick={restart}
          className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome': return renderWelcome();
      case 'mood': return renderMoodSelection();
      case 'flavor': return renderFlavorSelection();
      case 'temperature': return renderTemperatureSelection();
      case 'texture': return renderTextureSelection();
      case 'protocols': return renderProtocolSelection();
      case 'allergies': return renderAllergySelection();
      case 'camera': return renderCameraStep();
      case 'ingredients': return renderIngredientInput();
      case 'recommendations': return renderRecommendations();
      default: return renderWelcome();
    }
  };

  // Main render - show auth or main app
  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {renderAuth()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <UserHeader />
            {renderCurrentStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodEatingAssistant;