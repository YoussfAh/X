import asyncHandler from '../middleware/asyncHandler.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import User from '../models/userModel.js';
import {
  aggregateWorkoutData,
  aggregateSessionData,
  aggregateDietData,
  aggregateSleepData,
  aggregateWeightData,
  aggregateQuizData,
  calculateUserSummary
} from '../utils/dataAggregation.js';

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// @desc    Get all user data for AI analysis
// @route   GET /api/ai-analysis/user-data
// @access  Private
const getUserDataForAnalysis = asyncHandler(async (req, res) => {
  const { dataTypes, dateRange } = req.query;
  const userId = req.user._id;
  
  // Parse date range
  let dateFilter = {};
  if (dateRange) {
    const { startDate, endDate } = JSON.parse(dateRange);
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }
  }

  const userData = {
    user: {},
    workouts: [],
    sessions: [],
    diet: [],
    sleep: [],
    weight: [],
    quizzes: []
  };

  try {
    // Get user basic info
    const user = await User.findById(userId).select('name email createdAt');
    userData.user = {
      name: user.name,
      email: user.email,
      memberSince: user.createdAt,
      userId: user._id
    };

    const requestedTypes = dataTypes ? dataTypes.split(',') : ['all'];
    const includeAll = requestedTypes.includes('all');

    // Get workout data
    if (includeAll || requestedTypes.includes('workouts')) {
      userData.workouts = await aggregateWorkoutData(userId, dateFilter);
    }

    // Get workout sessions
    if (includeAll || requestedTypes.includes('sessions')) {
      userData.sessions = await aggregateSessionData(userId, dateFilter);
    }

    // Get diet data
    if (includeAll || requestedTypes.includes('diet')) {
      userData.diet = await aggregateDietData(userId, dateFilter);
    }

    // Get sleep data
    if (includeAll || requestedTypes.includes('sleep')) {
      userData.sleep = await aggregateSleepData(userId, dateFilter);
    }

    // Get weight data
    if (includeAll || requestedTypes.includes('weight')) {
      userData.weight = await aggregateWeightData(userId, dateFilter);
    }

    // Get quiz data
    if (includeAll || requestedTypes.includes('quizzes')) {
      userData.quizzes = await aggregateQuizData(userId);
    }

    // Add summary statistics
    userData.summary = calculateUserSummary(userData);

    res.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500);
    throw new Error('Failed to fetch user data for analysis');
  }
});

// @desc    Analyze user data with AI
// @route   POST /api/ai-analysis/analyze
// @access  Private
const analyzeUserData = asyncHandler(async (req, res) => {
  const { userData, prompt, analysisType = 'comprehensive' } = req.body;

  if (!userData || !prompt) {
    res.status(400);
    throw new Error('User data and prompt are required');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create a comprehensive prompt
    const systemPrompt = `You are an expert fitness and wellness coach with deep knowledge in exercise science, nutrition, sleep optimization, and behavior change. You're analyzing comprehensive user data to provide personalized insights and recommendations.

User Data Summary:
- Member since: ${userData.user?.memberSince || 'Recently joined'}
- Total workouts: ${userData.summary?.totalWorkouts || 0}
- Total diet entries: ${userData.summary?.totalDietEntries || 0}
- Sleep records: ${userData.summary?.totalSleepRecords || 0}
- Weight tracking records: ${userData.summary?.totalWeightRecords || 0}

Analysis Focus: ${analysisType}

Please provide insights that are:
1. Evidence-based and actionable
2. Personalized to their specific data patterns
3. Focused on both strengths and improvement areas
4. Include specific, measurable recommendations
5. Consider the interconnection between fitness, nutrition, sleep, and overall wellness

User's specific question/request: ${prompt}

Detailed Data:
${JSON.stringify(userData, null, 2)}

Please structure your response with clear sections and specific recommendations.`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const analysis = response.text();

    // Save analysis for future reference
    const analysisRecord = {
      userId: userData.user.userId,
      prompt,
      analysisType,
      response: analysis,
      dataSnapshot: {
        workoutCount: userData.workouts?.length || 0,
        dietCount: userData.diet?.length || 0,
        sleepCount: userData.sleep?.length || 0,
        weightCount: userData.weight?.length || 0
      },
      createdAt: new Date()
    };

    res.json({
      analysis,
      metadata: {
        analysisType,
        generatedAt: new Date(),
        dataPointsAnalyzed: {
          workouts: userData.workouts?.length || 0,
          diet: userData.diet?.length || 0,
          sleep: userData.sleep?.length || 0,
          weight: userData.weight?.length || 0,
          quizzes: userData.quizzes?.length || 0
        }
      }
    });
  } catch (error) {
    console.error('Error in AI analysis:', error);
    res.status(500);
    throw new Error('Failed to generate AI analysis');
  }
});

export {
  getUserDataForAnalysis,
  analyzeUserData
};
