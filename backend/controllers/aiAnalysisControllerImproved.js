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

    // Use utility functions for data aggregation
    if (includeAll || requestedTypes.includes('workouts')) {
      userData.workouts = await aggregateWorkoutData(userId, dateFilter);
    }

    if (includeAll || requestedTypes.includes('sessions')) {
      userData.sessions = await aggregateSessionData(userId, dateFilter);
    }

    if (includeAll || requestedTypes.includes('diet')) {
      userData.diet = await aggregateDietData(userId, dateFilter);
    }

    if (includeAll || requestedTypes.includes('sleep')) {
      userData.sleep = await aggregateSleepData(userId, dateFilter);
    }

    if (includeAll || requestedTypes.includes('weight')) {
      userData.weight = await aggregateWeightData(userId, dateFilter);
    }

    if (includeAll || requestedTypes.includes('quizzes')) {
      userData.quizzes = await aggregateQuizData(userId);
    }

    // Calculate comprehensive summary with advanced metrics
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

    // Create context-aware analysis based on data quality
    const dataQuality = userData.summary?.dataQuality?.overall || 0;
    const timespan = userData.summary?.timespan;
    
    let analysisContext = '';
    if (dataQuality < 30) {
      analysisContext = `
DATA LIMITATION NOTICE: This user has limited data (${dataQuality}% data completeness). 
Focus on:
1. Encouraging more consistent tracking
2. Providing guidance based on available data points
3. Setting up better tracking habits
4. Making the most of existing data patterns
`;
    } else if (dataQuality < 60) {
      analysisContext = `
MODERATE DATA AVAILABLE: This user has decent data coverage (${dataQuality}% completeness).
Focus on:
1. Identifying trends in existing data
2. Filling gaps in tracking
3. Building on current habits
4. Specific recommendations based on patterns observed
`;
    } else {
      analysisContext = `
COMPREHENSIVE DATA AVAILABLE: This user has excellent data coverage (${dataQuality}% completeness).
Focus on:
1. Deep pattern analysis
2. Advanced optimization strategies
3. Predictive insights
4. Detailed performance correlations
`;
    }

    // Create a comprehensive prompt that works well with limited data
    const systemPrompt = `You are an expert fitness and wellness coach with deep knowledge in exercise science, nutrition, sleep optimization, and behavior change. You're analyzing user data to provide personalized insights and recommendations.

${analysisContext}

USER PROFILE:
- Member since: ${userData.user?.memberSince || 'Recently joined'}
- Data timespan: ${timespan ? `${timespan.weeks} weeks (${timespan.days} days)` : 'Recent data only'}

SUMMARY METRICS:
- Workouts: ${userData.summary?.totalWorkouts || 0} sessions
- Diet entries: ${userData.summary?.totalDietEntries || 0} meals logged
- Sleep records: ${userData.summary?.totalSleepRecords || 0} nights
- Weight tracking: ${userData.summary?.totalWeightRecords || 0} entries
- Completed assessments: ${userData.summary?.completedQuizzes || 0}

PERFORMANCE INSIGHTS (when available):
- Workout frequency: ${userData.summary?.avgWorkoutsPerWeek || 0} sessions/week
- Consistency score: ${userData.summary?.workoutConsistency || 'N/A'}%
- Current streak: ${userData.summary?.currentStreak || 0} days
- Strongest exercise: ${userData.summary?.strongestLift?.exercise || 'Not determined'} at ${userData.summary?.strongestLift?.weight || 0}kg
- Volume progression: ${userData.summary?.volumeProgression || 'Insufficient data'}
- Exercise variety: ${userData.summary?.exerciseVariety || 0} different exercises

ANALYSIS TYPE: ${analysisType}

USER'S QUESTION: ${prompt}

INSTRUCTIONS:
1. **Be encouraging and supportive** - focus on progress made and potential for growth
2. **Provide actionable advice** - give specific, measurable recommendations
3. **Work with available data** - don't assume data that isn't there, but extrapolate meaningfully from what exists
4. **Address data gaps constructively** - suggest how to improve tracking for better insights
5. **Use a coaching tone** - be motivating and professional
6. **Structure your response** with clear sections and bullet points
7. **Include specific numbers** from their data when available
8. **Give timeline-based recommendations** - what to focus on this week, this month, etc.

If data is limited, focus more on:
- Establishing better tracking habits
- General best practices they can implement
- Creating systems for consistency
- Small, achievable goals

If data is comprehensive, provide:
- Detailed pattern analysis
- Specific performance optimizations
- Advanced training recommendations
- Predictive insights about progress

DETAILED DATA CONTEXT:
${JSON.stringify(userData, null, 2)}

Please provide a comprehensive, encouraging, and actionable analysis.`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const analysis = response.text();

    // Enhanced response with metadata
    res.json({
      analysis,
      metadata: {
        analysisType,
        generatedAt: new Date(),
        dataQuality: userData.summary?.dataQuality,
        timespan: userData.summary?.timespan,
        dataPointsAnalyzed: {
          workouts: userData.workouts?.length || 0,
          diet: userData.diet?.length || 0,
          sleep: userData.sleep?.length || 0,
          weight: userData.weight?.length || 0,
          quizzes: userData.quizzes?.length || 0
        },
        recommendations: {
          trackingImprovement: dataQuality < 50,
          needsMoreData: dataQuality < 30,
          readyForAdvancedAnalysis: dataQuality >= 70
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
