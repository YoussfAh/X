import aiService from '../utils/aiService.js';

export const analyzeNutritionFromImage = async (
  imageData, // Can be base64 string or URL
  mealName,
  description,
  mealType = 'other',
  quantity = 1,
  userComments = ''
) => {
  console.log('🔍 Starting enhanced nutrition analysis...');
  console.log('API Key available:', !!process.env.GOOGLE_AI_API_KEY);
  console.log('Meal name:', mealName);
  console.log('Description:', description);
  console.log('Meal type:', mealType);
  console.log('Quantity:', quantity);
  console.log('User comments:', userComments);
  console.log('Image data type:', typeof imageData);
  console.log(
    'Image data length/URL:',
    typeof imageData === 'string' ? imageData.substring(0, 100) + '...' : 'N/A'
  );

  try {
    // Check if AI service is available
    const serviceStatus = aiService.getStatus();
    if (serviceStatus.totalKeys === 0) {
      throw new Error('No Google AI API keys configured');
    }

    console.log(`🔧 AI Service status: ${serviceStatus.totalKeys} key(s) available, currently using key ${serviceStatus.currentKeyIndex}`);

    // Create the enhanced prompt for comprehensive nutrition analysis
    const prompt = `
    You are a professional nutritionist AI and health coach. Analyze this meal image and provide comprehensive nutrition and health information.

    CONTEXT INFORMATION:
    - Meal Name: ${mealName || 'Unknown meal'}
    - Current Description: ${description || 'No description provided'}
    - Meal Type: ${mealType} (breakfast, lunch, dinner, snack, other)
    - Serving Quantity: ${quantity}
    - User Notes: ${userComments || 'None provided'}

    ANALYSIS REQUIREMENTS:
    Please analyze the image and provide detailed information in this EXACT JSON format:

    {
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number,
      "confidence": "high|medium|low",
      "enhancedDescription": "Enhanced meal description with ingredients and cooking method",
      "healthComments": "Health suggestions, improvements, and nutritional insights",
      "estimatedWeight": number,
      "detailedAnalysis": "Comprehensive analysis of the meal",
      "suggestions": {
        "improvements": ["suggestion1", "suggestion2"],
        "healthBenefits": ["benefit1", "benefit2"],
        "concerns": ["concern1", "concern2"]
      },
      "mealContext": {
        "appropriateFor": ["breakfast", "lunch", "dinner", "snack"],
        "dietaryFlags": ["high-protein", "high-carb", "high-fat", "high-fiber", "high-sugar", "high-sodium"],
        "healthScore": number_1_to_10
      }
    }

    DETAILED INSTRUCTIONS:

    1. NUTRITION VALUES (for the entire meal shown):
       - Calculate calories, protein(g), carbs(g), fat(g), fiber(g)
       - Consider visible portion sizes and cooking methods
       - Account for oils, sauces, and hidden ingredients

    2. ENHANCED DESCRIPTION (will update the description field):
       - Identify all visible ingredients
       - Note cooking methods (grilled, fried, steamed, etc.)
       - Describe portion sizes and presentation
       - Mention any sauces, seasonings, or garnishes
       - Keep it factual and descriptive (100-150 words)

    3. HEALTH COMMENTS (will go in comments field):
       - Provide constructive health suggestions
       - If high in sugar: suggest reducing sugar or adding protein
       - If lacking vegetables: recommend adding greens or colorful veggies
       - If high in processed foods: suggest whole food alternatives
       - If well-balanced: acknowledge the good choices
       - Include tips for improvement (80-120 words)

    4. ESTIMATED WEIGHT:
       - Estimate total weight of the meal in grams
       - Consider all visible components

    5. DETAILED ANALYSIS:
       - Professional nutritionist perspective
       - Nutrient density assessment
       - Meal timing appropriateness
       - Balance of macronutrients

    6. HEALTH SCORE (1-10):
       - 9-10: Excellent (whole foods, balanced, nutrient-dense)
       - 7-8: Good (mostly healthy with minor improvements needed)
       - 5-6: Average (balanced but could be improved)
       - 3-4: Poor (high in processed foods, unbalanced)
       - 1-2: Very poor (mostly junk food, nutritionally poor)

    SPECIAL CONSIDERATIONS:
    - If meal appears to be ${mealType}, adjust recommendations accordingly
    - Consider if this is appropriate for the meal type
    - Factor in the quantity (${quantity} serving${quantity > 1 ? 's' : ''})
    - Be encouraging but honest about health aspects
    - Provide actionable, specific suggestions

    RESPONSE FORMAT: Respond ONLY with the valid JSON object above, no additional text.
    `;

    // Handle both Cloudinary URLs and base64 data
    console.log('📷 Processing image data...');
    let imageParts;

    // Check if imageData is a Cloudinary URL
    if (typeof imageData === 'string' && imageData.includes('cloudinary.com')) {
      console.log('🌐 Fetching image from Cloudinary URL to convert to base64');
      try {
        // Fetch the image from Cloudinary and convert to base64
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(imageData);

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const buffer = await response.buffer();
        const base64Data = buffer.toString('base64');
        console.log(
          '✅ Successfully fetched and converted Cloudinary image to base64'
        );

        imageParts = [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/jpeg',
            },
          },
        ];
      } catch (fetchError) {
        console.error('❌ Failed to fetch Cloudinary image:', fetchError);
        throw new Error('Failed to process Cloudinary image URL');
      }
    } else {
      console.log('📄 Using base64 data');
      // Handle base64 data (existing functionality)
      let cleanImageData;
      try {
        cleanImageData = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
        console.log('Image data cleaned, length:', cleanImageData.length);
      } catch (error) {
        throw new Error('Invalid image data format');
      }

      imageParts = [
        {
          inlineData: {
            data: cleanImageData,
            mimeType: 'image/jpeg',
          },
        },
      ];
    }

    // Generate content using AI service with vision model
    console.log('🤖 Calling Gemini API with enhanced multi-key service...');
    const text = await aiService.generateContent([prompt, ...imageParts], null, true);
    console.log('📝 Gemini response:', text);

    // Parse the JSON response
    let nutritionData;
    try {
      // Clean the response text to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        nutritionData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', text);
      throw new Error('Invalid response format from AI');
    }

    // Validate the response structure
    if (
      !nutritionData ||
      typeof nutritionData.calories !== 'number' ||
      typeof nutritionData.protein !== 'number' ||
      typeof nutritionData.carbs !== 'number' ||
      typeof nutritionData.fat !== 'number' ||
      typeof nutritionData.fiber !== 'number'
    ) {
      throw new Error('Invalid nutrition data structure');
    }

    return {
      success: true,
      data: {
        // Basic nutrition data
        calories: Math.round(nutritionData.calories),
        protein: Math.round(nutritionData.protein * 10) / 10,
        carbs: Math.round(nutritionData.carbs * 10) / 10,
        fat: Math.round(nutritionData.fat * 10) / 10,
        fiber: Math.round(nutritionData.fiber * 10) / 10,
        confidence: nutritionData.confidence || 'medium',

        // Enhanced information
        enhancedDescription:
          nutritionData.enhancedDescription ||
          nutritionData.analysis ||
          'AI analysis completed',
        healthComments:
          nutritionData.healthComments ||
          'No specific health recommendations available',
        estimatedWeight: nutritionData.estimatedWeight || 0,
        detailedAnalysis:
          nutritionData.detailedAnalysis || 'Detailed analysis not available',

        // Structured suggestions
        suggestions: nutritionData.suggestions || {
          improvements: [],
          healthBenefits: [],
          concerns: [],
        },

        // Meal context
        mealContext: nutritionData.mealContext || {
          appropriateFor: [mealType],
          dietaryFlags: [],
          healthScore: 5,
        },

        // Legacy field for backward compatibility
        analysis:
          nutritionData.detailedAnalysis ||
          nutritionData.analysis ||
          'AI analysis completed',
      },
    };
  } catch (error) {
    console.error('❌ Gemini API Error:', error);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Return fallback response for common foods if AI fails
    const fallbackNutrition = generateFallbackNutrition(
      mealName,
      description,
      mealType
    );
    console.log('🔄 Using fallback nutrition:', fallbackNutrition);

    return {
      success: false,
      error: error.message,
      fallback: fallbackNutrition,
      data: fallbackNutrition,
    };
  }
};

// Enhanced fallback nutrition estimation based on meal name and description
const generateFallbackNutrition = (
  mealName = '',
  description = '',
  mealType = 'other'
) => {
  const text = `${mealName} ${description}`.toLowerCase();

  // Basic estimates for common meal types
  let calories = 400,
    protein = 20,
    carbs = 40,
    fat = 15,
    fiber = 5,
    estimatedWeight = 300;

  let enhancedDescription = `${mealName || 'Unknown meal'}`;
  let healthComments =
    'General nutrition analysis based on meal name. For more accurate results, ensure image is clear and well-lit.';
  let healthScore = 5;
  let dietaryFlags = [];
  let improvements = [
    'Consider adding more vegetables',
    'Ensure balanced macronutrients',
  ];
  let concerns = ['Unable to analyze image - estimates may be inaccurate'];

  // Adjust based on keywords
  if (text.includes('salad')) {
    calories = 200;
    protein = 10;
    carbs = 15;
    fat = 10;
    fiber = 8;
    estimatedWeight = 250;
    enhancedDescription = 'Fresh salad with mixed greens and various toppings';
    healthComments =
      'Excellent choice! Salads are rich in vitamins and minerals. Consider adding protein like grilled chicken or beans for satiety.';
    healthScore = 8;
    dietaryFlags = ['high-fiber', 'low-calorie'];
    improvements = ['Add protein source', 'Include healthy fats like avocado'];
    concerns = [];
  } else if (text.includes('pizza')) {
    calories = 600;
    protein = 25;
    carbs = 70;
    fat = 25;
    fiber = 3;
    estimatedWeight = 400;
    enhancedDescription =
      'Pizza slice with cheese, sauce, and various toppings on bread crust';
    healthComments =
      'Pizza can be high in sodium and refined carbs. Try whole wheat crust and load up on vegetables for better nutrition.';
    healthScore = 4;
    dietaryFlags = ['high-carb', 'high-sodium'];
    improvements = [
      'Choose thin crust',
      'Add more vegetables',
      'Reduce cheese portion',
    ];
    concerns = ['High in processed ingredients', 'May be high in sodium'];
  } else if (text.includes('burger')) {
    calories = 700;
    protein = 35;
    carbs = 50;
    fat = 35;
    fiber = 4;
    estimatedWeight = 350;
    enhancedDescription = 'Burger with meat patty, bun, and various toppings';
    healthComments =
      'Burgers can be nutritious if made with lean meat and whole grain buns. Balance with vegetables and avoid processed additions.';
    healthScore = 4;
    dietaryFlags = ['high-protein', 'high-fat'];
    improvements = [
      'Use whole grain bun',
      'Add lettuce and tomato',
      'Choose lean meat',
    ];
    concerns = ['May be high in saturated fat', 'Refined carbohydrates in bun'];
  } else if (text.includes('pasta')) {
    calories = 500;
    protein = 18;
    carbs = 75;
    fat = 12;
    fiber = 4;
    estimatedWeight = 350;
    enhancedDescription =
      'Pasta dish with sauce and possible protein additions';
    healthComments =
      'Pasta provides energy from carbohydrates. Choose whole grain pasta and add vegetables for better nutrition balance.';
    healthScore = 6;
    dietaryFlags = ['high-carb'];
    improvements = [
      'Use whole grain pasta',
      'Add vegetables',
      'Include lean protein',
    ];
    concerns = ['High in refined carbohydrates'];
  } else if (text.includes('rice') || text.includes('curry')) {
    calories = 450;
    protein = 22;
    carbs = 55;
    fat = 15;
    fiber = 3;
    estimatedWeight = 400;
    enhancedDescription = 'Rice-based dish with protein and sauce';
    healthComments =
      'Rice dishes can be well-balanced. Brown rice provides more fiber and nutrients than white rice.';
    healthScore = 6;
    dietaryFlags = ['high-carb'];
    improvements = [
      'Use brown rice',
      'Add more vegetables',
      'Control portion size',
    ];
    concerns = ['May lack vegetables'];
  } else if (text.includes('chicken')) {
    calories = 350;
    protein = 45;
    carbs = 5;
    fat = 15;
    fiber = 1;
    estimatedWeight = 200;
    enhancedDescription = 'Chicken-based protein dish';
    healthComments =
      'Excellent protein source! Chicken is lean and nutritious. Pair with vegetables and complex carbohydrates.';
    healthScore = 8;
    dietaryFlags = ['high-protein', 'low-carb'];
    improvements = ['Add complex carbohydrates', 'Include colorful vegetables'];
    concerns = [];
  } else if (text.includes('fish')) {
    calories = 300;
    protein = 40;
    carbs = 3;
    fat = 12;
    fiber = 0;
    estimatedWeight = 180;
    enhancedDescription = 'Fish-based protein dish';
    healthComments =
      'Fantastic choice! Fish provides high-quality protein and healthy omega-3 fatty acids. Great for heart health.';
    healthScore = 9;
    dietaryFlags = ['high-protein', 'low-carb', 'healthy-fats'];
    improvements = ['Add vegetables', 'Include whole grains'];
    concerns = [];
  } else if (text.includes('vegetable') || text.includes('vegan')) {
    calories = 250;
    protein = 12;
    carbs = 35;
    fat = 8;
    fiber = 12;
    estimatedWeight = 300;
    enhancedDescription = 'Plant-based meal with vegetables and plant proteins';
    healthComments =
      'Great plant-based choice! Rich in fiber and antioxidants. Ensure adequate protein and B12 for complete nutrition.';
    healthScore = 8;
    dietaryFlags = ['high-fiber', 'plant-based', 'low-calorie'];
    improvements = ['Ensure protein adequacy', 'Consider B12 supplementation'];
    concerns = [];
  }

  return {
    calories,
    protein,
    carbs,
    fat,
    fiber,
    confidence: 'low',
    enhancedDescription,
    healthComments,
    estimatedWeight,
    detailedAnalysis: `Fallback analysis based on meal name "${mealName}". ${enhancedDescription}. ${healthComments}`,
    suggestions: {
      improvements,
      healthBenefits: [
        'Provides essential nutrients',
        'Contributes to daily caloric needs',
      ],
      concerns,
    },
    mealContext: {
      appropriateFor: ['breakfast', 'lunch', 'dinner', 'snack'],
      dietaryFlags,
      healthScore,
    },
    analysis: `Estimated nutrition for ${mealName}. For accurate analysis, please ensure clear image quality.`,
  };
};

export default { analyzeNutritionFromImage };
