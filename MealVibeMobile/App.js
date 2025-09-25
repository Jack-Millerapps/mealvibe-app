import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function App() {
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

  // Your Vercel API URL - replace with your actual URL
  const API_BASE_URL = 'https://mealvibe.vercel.app/api';

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
    'Paleo', 'Keto', 'Whole30', 'Mediterranean', 'Low FODMAP', 'AIP', 'Vegetarian', 'Vegan', 'None'
  ];

  const allergies = [
    'Tree nuts', 'Peanuts', 'Dairy', 'Gluten', 'Eggs', 'Other'
  ];

  const handleMultiSelection = (step, value) => {
    setUserInputs(prev => ({
      ...prev,
      [step]: prev[step].includes(value) 
        ? prev[step].filter(item => item !== value)
        : [...prev[step], value]
    }));
  };

  const handleTextInput = (step, value) => {
    setUserInputs(prev => ({
      ...prev,
      [step]: value
    }));
  };

  const callAPI = async (requestType = 'initial') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInputs,
          requestType
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
        setRecommendations(prev => ({
          ...prev,
          suggestions: data.suggestions
        }));
      }

    } catch (error) {
      console.error('API Error:', error);
      setError('Unable to generate recommendations. Please try again.');
      
      // Fallback recommendations
      const fallbackMessage = "Let's find something that feels just right for you today.";
      const fallbackSuggestions = [
        {
          title: "Simple Chicken Bowl",
          prep: "Pan-sear chicken breast with herbs. Serve over greens with avocado and olive oil dressing.",
          vibe: "Protein-Rich • Clean • Satisfying",
          time: "20 mins"
        },
        {
          title: "Salmon & Sweet Potato",
          prep: "Bake salmon fillet and roasted sweet potato cubes. Season with lemon and herbs.",
          vibe: "Omega-Rich • Nourishing • Simple",
          time: "25 mins"
        },
        {
          title: "Turkey & Veggie Wrap",
          prep: "Wrap sliced turkey, cucumber, and sprouts in lettuce leaves with mustard or hummus.",
          vibe: "Fresh • Lean • Light",
          time: "5 mins"
        }
      ];
        
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

  const nextStep = () => {
    const steps = ['welcome', 'mood', 'flavor', 'temperature', 'texture', 'protocols', 'allergies', 'ingredients'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    } else {
      callAPI('initial');
    }
  };

  const restart = () => {
    setCurrentStep('welcome');
    setUserInputs({
      mood: [],
      flavor: [],
      temperature: [],
      texture: [],
      protocols: [],
      allergies: [],
      otherAllergy: '',
      ingredients: ''
    });
    setRecommendations([]);
    setError(null);
  };

  const renderWelcome = () => (
    <ScrollView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="heart" size={48} color="#8b5cf6" style={styles.icon} />
            <Text style={styles.title}>MealVibe</Text>
            <Text style={styles.subtitle}>Your mood-aware food companion</Text>
          </View>
          
          <LinearGradient
            colors={['#f3e8ff', '#ede9fe']}
            style={styles.card}
          >
            <Text style={styles.cardText}>
              No more staring into the fridge feeling uninspired. I'll help you discover clean, 
              nourishing meals that match your mood and cravings.
            </Text>
            
            <TouchableOpacity 
              style={styles.button} 
              onPress={nextStep}
            >
              <Text style={styles.buttonText}>Let's Start</Text>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </SafeAreaView>
    </ScrollView>
  );

  const renderMultiSelect = (title, subtitle, options, step, buttonColor = '#8b5cf6') => (
    <ScrollView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.questionTitle}>{title}</Text>
          <Text style={styles.questionSubtitle}>{subtitle}</Text>
          
          <View style={styles.optionsGrid}>
            {options.map((option) => {
              const isSelected = userInputs[step].includes(option.id || option);
              return (
                <TouchableOpacity 
                  key={option.id || option} 
                  style={[
                    styles.optionCard,
                    isSelected && styles.selectedCard
                  ]}
                  onPress={() => handleMultiSelection(step, option.id || option)}
                >
                  {option.emoji && (
                    <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  )}
                  <Text style={[
                    styles.optionLabel,
                    isSelected && styles.selectedLabel
                  ]}>
                    {option.label || option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {userInputs[step].length > 0 && (
            <TouchableOpacity 
              style={[styles.continueButton, { backgroundColor: buttonColor }]}
              onPress={nextStep}
            >
              <Text style={styles.buttonText}>Continue</Text>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </ScrollView>
  );

  const renderAllergySelection = () => (
    <ScrollView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.questionTitle}>What allergies or intolerances do you have?</Text>
          <Text style={styles.questionSubtitle}>Check all that apply</Text>
          
          <View style={styles.optionsGrid}>
            {allergies.map((allergy) => {
              const isSelected = userInputs.allergies.includes(allergy);
              return (
                <TouchableOpacity 
                  key={allergy} 
                  style={[
                    styles.optionCard,
                    isSelected && styles.selectedCard
                  ]}
                  onPress={() => handleMultiSelection('allergies', allergy)}
                >
                  <Text style={[
                    styles.optionLabel,
                    isSelected && styles.selectedLabel
                  ]}>
                    {allergy}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {userInputs.allergies.includes('Other') && (
            <View style={styles.textInputContainer}>
              <Text style={styles.inputLabel}>
                Please specify your other allergy or intolerance:
              </Text>
              <TextInput
                style={styles.textInput}
                value={userInputs.otherAllergy}
                onChangeText={(text) => handleTextInput('otherAllergy', text)}
                placeholder="e.g., shellfish, nightshades, etc."
                placeholderTextColor="#9ca3af"
              />
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={nextStep}
          >
            <Text style={styles.buttonText}>Continue</Text>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  );

  const renderIngredientInput = () => (
    <ScrollView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.questionTitle}>Any ingredients you have on-hand that sound good?</Text>
          <Text style={styles.questionSubtitle}>Optional - help us personalize your suggestions</Text>
          
          <TextInput
            style={styles.textArea}
            value={userInputs.ingredients}
            onChangeText={(text) => handleTextInput('ingredients', text)}
            placeholder="e.g., avocados, leftover chicken, sweet potatoes..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          <TouchableOpacity 
            style={[styles.continueButton, { backgroundColor: '#f43f5e' }]}
            onPress={nextStep}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text style={styles.buttonText}>Get My Recommendations</Text>
                <Ionicons name="chevron-forward" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  );

  const renderRecommendations = () => (
    <ScrollView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.questionTitle}>Perfect! Here are your recommendations</Text>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              {recommendations.message}
            </Text>
          </View>
          
          <View style={styles.recommendationsContainer}>
            {recommendations.suggestions?.map((suggestion, index) => (
              <View key={index} style={styles.recommendationCard}>
                <Text style={styles.recommendationTitle}>{suggestion.title}</Text>
                
                <View style={styles.badgeContainer}>
                  <View style={styles.vibeBadge}>
                    <Text style={styles.vibeText}>{suggestion.vibe}</Text>
                  </View>
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeText}>🕐 {suggestion.time}</Text>
                  </View>
                </View>
                
                <Text style={styles.prepText}>{suggestion.prep}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.moreButton]}
              onPress={() => callAPI('more')}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="refresh" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Show Me More</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.restartButton]}
              onPress={restart}
            >
              <Text style={styles.actionButtonText}>Start Over</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome': 
        return renderWelcome();
      case 'mood': 
        return renderMultiSelect(
          'How are you feeling right now?',
          'Choose all that apply',
          moods,
          'mood'
        );
      case 'flavor': 
        return renderMultiSelect(
          'What sounds good?',
          'Choose all that apply',
          flavors,
          'flavor'
        );
      case 'temperature': 
        return renderMultiSelect(
          'What temperature do you want it to be?',
          'Choose all that apply',
          temperatures,
          'temperature'
        );
      case 'texture': 
        return renderMultiSelect(
          'What texture are you craving?',
          'Choose all that apply',
          textures,
          'texture',
          '#f43f5e'
        );
      case 'protocols': 
        return renderMultiSelect(
          'Which nutritional protocols should be accounted for?',
          'Check all that apply',
          protocols,
          'protocols'
        );
      case 'allergies': 
        return renderAllergySelection();
      case 'ingredients': 
        return renderIngredientInput();
      case 'recommendations': 
        return renderRecommendations();
      default: 
        return renderWelcome();
    }
  };

  return (
    <LinearGradient
      colors={['#f3e8ff', '#ede9fe', '#ddd6fe']}
      style={styles.background}
    >
      {renderCurrentStep()}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
  },
  card: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  cardText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  optionCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  selectedCard: {
    borderColor: '#8b5cf6',
    backgroundColor: '#f3e8ff',
  },
  optionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'center',
  },
  selectedLabel: {
    color: '#8b5cf6',
  },
  continueButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  textInputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    fontSize: 16,
    color: '#1f2937',
    width: '100%',
    height: 120,
    marginBottom: 30,
  },
  errorContainer: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#92400e',
    fontSize: 14,
    textAlign: 'center',
  },
  messageContainer: {
    backgroundColor: '#f3e8ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  messageText: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  recommendationsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  recommendationCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  vibeBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 4,
  },
  vibeText: {
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: '500',
  },
  timeBadge: {
    backgroundColor: '#fed7aa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 4,
  },
  timeText: {
    color: '#ea580c',
    fontSize: 12,
    fontWeight: '500',
  },
  prepText: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButton: {
    backgroundColor: '#f97316',
  },
  restartButton: {
    backgroundColor: '#6b7280',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});