import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/userModel.js';
import AiAnalysis from '../models/aiAnalysisModel.js';
import aiService from '../utils/aiService.js';
import ResponseFormatter from '../utils/responseFormatter.js';
import {
  aggregateWorkoutData,
  aggregateSessionData,
  aggregateDietData,
  aggregateSleepData,
  aggregateWeightData,
  aggregateQuizData,
  calculateUserSummary
} from '../utils/dataAggregation.js';

// Helper function to retry AI analysis with exponential backoff for overloaded models
const retryAIAnalysis = async (analysisPrompt, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 AI Analysis attempt ${attempt}/${maxRetries}`);
      const result = await aiService.generateContent(analysisPrompt);
      return result;
    } catch (error) {
      console.error(`❌ AI Analysis attempt ${attempt} failed:`, error.message);
      
      // If it's the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Check if it's an overloaded error that we should retry
      if (error.message.includes('overloaded') || 
          error.message.includes('Service Unavailable') ||
          error.message.includes('MODELS OVERLOADED') ||
          error.message.includes('MODELS PARTIALLY OVERLOADED')) {
        const backoffDelay = Math.min(5000 * Math.pow(2, attempt - 1), 60000); // Max 60 seconds
        console.log(`⏱️ Models overloaded. Waiting ${backoffDelay}ms before retry ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        continue;
      }
      
      // For other errors, don't retry
      throw error;
    }
  }
};

// @desc    Get all user data for AI analysis
// @route   GET /api/ai-analysis/user-data
// @access  Private (Admin can specify userId)
const getUserDataForAnalysis = asyncHandler(async (req, res) => {
  const { dataTypes, dateRange, userId: requestedUserId } = req.query;
  
  console.log('=== AI Analysis Data Request ===');
  console.log('Raw request query:', req.query);
  console.log('Request query params:', { dataTypes, dateRange, requestedUserId });
  console.log('Request user:', req.user ? `${req.user.name} (${req.user._id})` : 'Not logged in');
  console.log('Request headers:', req.headers.authorization ? 'Has auth' : 'No auth');
  
  // Determine which user's data to fetch
  let targetUserId = req.user._id;
  if (requestedUserId && req.user.isAdmin) {
    targetUserId = requestedUserId;
    console.log(`Admin requesting data for user: ${targetUserId}`);
  } else if (requestedUserId && !req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied. Admin privileges required to access other users data.' });
  } else {
    console.log(`Regular user requesting own data: ${targetUserId}`);
  }
  
  // Parse date range - always apply if provided
  let dateFilter = {};
  if (dateRange && dateRange !== 'null' && dateRange !== 'undefined') {
    try {
      const parsedDateRange = JSON.parse(dateRange);
      const { startDate, endDate, preset } = parsedDateRange;
      
      console.log(`=== DATE FILTERING DEBUG ===`);
      console.log(`Raw dateRange:`, dateRange);
      console.log(`Parsed dateRange:`, parsedDateRange);
      console.log(`Preset: ${preset}, Start: ${startDate}, End: ${endDate}`);
      
      // Apply date filter for all presets except "all"
      if (preset !== 'all' && (startDate || endDate)) {
        // Create date filter for most collections (workouts, diet, sleep, weight use 'date' field)
        dateFilter.date = {};
        if (startDate) {
          const startOfDay = new Date(startDate);
          startOfDay.setHours(0, 0, 0, 0);
          dateFilter.date.$gte = startOfDay;
          console.log(`Start date filter: ${startOfDay}`);
        }
        if (endDate) {
          // Set end date to end of day to include the full day
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          dateFilter.date.$lte = endOfDay;
          console.log(`End date filter: ${endOfDay}`);
        }
        
        console.log(`Applied date filter for preset "${preset}":`, dateFilter);
      } else if (preset === 'all') {
        console.log('Using "All Data" preset - no date filtering applied');
      } else {
        console.log('No valid date range provided - using all data');
      }
    } catch (error) {
      console.warn('Invalid date range format:', dateRange, error);
    }
  } else {
    console.log('No date range provided - using all data');
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
    const user = await User.findById(targetUserId).select('name email createdAt');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
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
      userData.workouts = await aggregateWorkoutData(targetUserId, dateFilter);
    }

    if (includeAll || requestedTypes.includes('sessions')) {
      userData.sessions = await aggregateSessionData(targetUserId, dateFilter);
    }

    if (includeAll || requestedTypes.includes('diet')) {
      userData.diet = await aggregateDietData(targetUserId, dateFilter);
    }

    if (includeAll || requestedTypes.includes('sleep')) {
      userData.sleep = await aggregateSleepData(targetUserId, dateFilter);
    }

    if (includeAll || requestedTypes.includes('weight')) {
      userData.weight = await aggregateWeightData(targetUserId, dateFilter);
    }

    if (includeAll || requestedTypes.includes('quizzes')) {
      try {
        userData.quizzes = await aggregateQuizData(targetUserId, dateFilter);
        console.log(`Loaded ${userData.quizzes.length} quiz records for user ${targetUserId} with date filter applied`);
      } catch (error) {
        console.error('Error loading quiz data:', error);
        userData.quizzes = [];
      }
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
// @access  Private (Admin can analyze other users)
const analyzeUserData = asyncHandler(async (req, res) => {
  const { userData, prompt, analysisType = 'comprehensive', dataTypes = 'all', dateRange, userId: requestedUserId } = req.body;
  
  // Determine which user the analysis is for
  let targetUserId = req.user._id;
  if (requestedUserId && req.user.isAdmin) {
    targetUserId = requestedUserId;
  } else if (requestedUserId && !req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied. Admin privileges required to analyze other users data.' });
  }

  if (!userData || !prompt) {
    res.status(400);
    throw new Error('User data and prompt are required');
  }

  const startTime = Date.now();

  try {
    // Use the enhanced AI service with multiple API key support
    let analysis;
    let analysisPrompt;

    // For custom analysis type, use the user's prompt exactly
    if (analysisType === 'custom') {
      analysisPrompt = `
CONTEXT: You are analyzing fitness and wellness data for a user. Here is their data:

${JSON.stringify(userData, null, 2)}

USER'S CUSTOM REQUEST: ${prompt}

Please provide a comprehensive response based on the data provided.`;

      // Use AI service with retry logic instead of direct model call
      analysis = await retryAIAnalysis(analysisPrompt);
    } else {
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

      // Create analysis-type-specific guidance
      let analysisGuidance = '';
      switch (analysisType) {
        case 'performance':
          analysisGuidance = `
PERFORMANCE FOCUS: Prioritize training effectiveness, strength progression, and athletic performance metrics.
- Analyze workout volume, intensity, and progression trends
- Identify performance plateaus and breakthrough strategies
- Focus on exercise form, program periodization, and recovery balance
- Provide specific training recommendations and optimization strategies
`;
          break;
        case 'nutrition':
          analysisGuidance = `
NUTRITION FOCUS: Emphasize dietary patterns, nutritional balance, and eating behaviors.
- Analyze macronutrient distribution and meal timing
- Identify nutritional gaps and improvement opportunities
- Focus on sustainable eating habits and meal planning
- Provide specific dietary recommendations aligned with fitness goals
`;
          break;
        case 'recovery':
          analysisGuidance = `
RECOVERY FOCUS: Prioritize sleep quality, rest patterns, and recovery optimization.
- Analyze sleep duration, quality, and consistency patterns
- Examine correlations between sleep and workout performance
- Focus on recovery strategies and stress management
- Provide specific sleep hygiene and recovery recommendations
`;
          break;
        case 'progress':
          analysisGuidance = `
PROGRESS FOCUS: Emphasize goal achievement, tracking trends, and measurable improvements.
- Analyze progress trajectories across all metrics
- Identify successful patterns and areas needing attention
- Focus on goal-setting and milestone achievement
- Provide specific progress tracking and goal adjustment strategies
`;
          break;
        case 'consistency':
          analysisGuidance = `
CONSISTENCY FOCUS: Emphasize habit formation, routine adherence, and behavioral patterns.
- Analyze consistency across workouts, nutrition, and sleep tracking
- Identify triggers for success and barriers to consistency
- Focus on habit stacking and routine optimization
- Provide specific strategies for building sustainable habits
`;
          break;
        case 'troubleshooting':
          analysisGuidance = `
TROUBLESHOOTING FOCUS: Identify problems, plateaus, and areas requiring intervention.
- Analyze data for concerning patterns or stagnation
- Identify potential causes of plateaus or regression
- Focus on problem-solving and corrective strategies
- Provide specific solutions and alternative approaches
`;
          break;
        case 'motivation':
          analysisGuidance = `
MOTIVATION FOCUS: Emphasize encouragement, mindset, and psychological aspects of fitness.
- Highlight achievements and positive progress indicators
- Address mental barriers and motivation challenges
- Focus on building confidence and maintaining enthusiasm
- Provide specific motivational strategies and mindset coaching
`;
          break;
        default: // comprehensive
          analysisGuidance = `
COMPREHENSIVE ANALYSIS: Provide a balanced, holistic view of the user's fitness journey.
- Cover all aspects: performance, nutrition, recovery, progress, and habits
- Identify the most important insights across all data types
- Balance encouragement with constructive feedback
- Provide actionable recommendations across multiple domains
`;
      }

      // Create a comprehensive prompt that works well with limited data
      analysisPrompt = `You are an expert fitness and wellness coach with deep knowledge in exercise science, nutrition, sleep optimization, and behavior change. You're analyzing user data to provide personalized insights and recommendations.

${analysisContext}

${analysisGuidance}

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
6. **Structure your response clearly** with these sections:
   - ## Key Findings
   - ## Performance Analysis  
   - ## Recommendations
   - ## Next Steps
7. **Include specific numbers** from their data when available
8. **Give timeline-based recommendations** - what to focus on this week, this month, etc.
9. **Use bullet points for lists** and keep paragraphs concise
10. **Highlight important metrics** with bold formatting

FORMATTING GUIDELINES:
- Use ## for section headers
- Use • for bullet points  
- Use **text** for important metrics and emphasis (but not excessively)
- Keep paragraphs to 2-3 sentences max
- Use specific numbers when available
- Structure recommendations as actionable items

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

      // Use AI service for the main analysis
      analysis = await retryAIAnalysis(analysisPrompt);
    }

    // Format the AI response for better readability
    const formattedAnalysis = ResponseFormatter.formatResponse(analysis);
    const analysisSummary = ResponseFormatter.createSummary(formattedAnalysis);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log('📝 AI Analysis completed:', {
      originalLength: analysis.length,
      formattedLength: formattedAnalysis.length,
      sectionsFound: analysisSummary.sections.length,
      recommendationsFound: analysisSummary.recommendations.length,
      responseTime
    });

    // Save analysis to database
    console.log('Attempting to save analysis to database for user:', targetUserId);
    let savedAnalysis = null;
    try {
      savedAnalysis = await AiAnalysis.create({
        user: targetUserId,
        prompt,
        analysisType,
        response: formattedAnalysis, // Save the formatted response
        rawResponse: analysis, // Keep original for reference
        summary: analysisSummary, // Store structured summary
        dataUsed: {
          workoutsCount: userData.workouts?.length || 0,
          dietCount: userData.diet?.length || 0,
          sleepCount: userData.sleep?.length || 0,
          weightCount: userData.weight?.length || 0,
          quizzesCount: userData.quizzes?.length || 0,
          dateRange: userData.summary?.timespan ? {
            startDate: userData.summary.timespan.earliest,
            endDate: userData.summary.timespan.latest
          } : null,
          dataTypes: dataTypes ? dataTypes.split(',') : ['all']
        },
        metadata: {
          responseTime,
          tokenCount: analysis.length, // Rough estimation
          model: 'gemini-1.5-flash'
        }
      });
      console.log('Analysis saved successfully with ID:', savedAnalysis._id);

      // Enhanced response with metadata
      res.json({
        id: savedAnalysis ? savedAnalysis._id : null,
        analysis: formattedAnalysis,
        summary: analysisSummary,
        metadata: {
          analysisType,
          generatedAt: savedAnalysis ? savedAnalysis.createdAt : new Date(),
          dataQuality: userData.summary?.dataQuality,
          timespan: userData.summary?.timespan,
          dateRange: dateRange ? JSON.parse(dateRange) : null,
          responseTime,
          dataPointsAnalyzed: {
            workouts: userData.workouts?.length || 0,
            diet: userData.diet?.length || 0,
            sleep: userData.sleep?.length || 0,
            weight: userData.weight?.length || 0,
            quizzes: userData.quizzes?.length || 0
          },
          recommendations: {
            trackingImprovement: (userData.summary?.dataQuality?.overall || 0) < 50,
            needsMoreData: (userData.summary?.dataQuality?.overall || 0) < 30,
            readyForAdvancedAnalysis: (userData.summary?.dataQuality?.overall || 0) >= 70
          }
        }
      });
    } catch (saveError) {
      console.error('Error saving analysis to database:', saveError);
      // Continue with response even if save fails
      res.json({
        id: null,
        analysis: formattedAnalysis,
        summary: analysisSummary,
        metadata: {
          analysisType,
          generatedAt: new Date(),
          dataQuality: userData.summary?.dataQuality,
          timespan: userData.summary?.timespan,
          dateRange: dateRange ? JSON.parse(dateRange) : null,
          responseTime,
          dataPointsAnalyzed: {
            workouts: userData.workouts?.length || 0,
            diet: userData.diet?.length || 0,
            sleep: userData.sleep?.length || 0,
            weight: userData.weight?.length || 0,
            quizzes: userData.quizzes?.length || 0
          },
          recommendations: {
            trackingImprovement: (userData.summary?.dataQuality?.overall || 0) < 50,
            needsMoreData: (userData.summary?.dataQuality?.overall || 0) < 30,
            readyForAdvancedAnalysis: (userData.summary?.dataQuality?.overall || 0) >= 70
          },
          saveError: 'Failed to save analysis'
        }
      });
    }
  } catch (error) {
    console.error('Error in AI analysis:', error);
    
    // Get service status for better error reporting
    const serviceStatus = aiService.getStatus();
    
    // Check if it's an API key related error
    if (error.message.includes('ALL API QUOTA EXCEEDED')) {
      res.status(429); // Too Many Requests
      throw new Error(`🚫 All ${serviceStatus.totalKeys} Google AI API keys have reached their daily quota. Service will resume when quotas reset (typically at midnight PST). Consider adding more API keys for higher daily limits.`);
    } else if (error.message.includes('PARTIAL QUOTA EXCEEDED')) {
      res.status(503); // Service Unavailable
      throw new Error(`⚠️ Some API keys have exceeded quota, but service is still available. Currently using ${serviceStatus.totalKeys} API keys. Error: ${error.message}`);
    } else if (error.message.includes('ALL API KEYS INVALID')) {
      res.status(500);
      throw new Error(`🔑 All configured Google AI API keys are invalid. Please check your API key configuration.`);
    } else if (error.message.includes('NO VALID API KEYS')) {
      res.status(500);
      throw new Error(`🔧 No valid Google AI API keys found. Please configure at least GOOGLE_AI_API_KEY_1 in your environment variables.`);
    } else {
      // For other errors, provide the actual error message
      res.status(500);
      throw new Error(`❌ AI Analysis Failed: ${error.message}. Service status: ${serviceStatus.totalKeys} keys available, currently using key ${serviceStatus.currentKeyIndex}.`);
    }
  }
});

// @desc    Get user's AI analysis history
// @route   GET /api/ai-analysis/history
// @access  Private
const getAnalysisHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, analysisType, isFavorite, userId: requestedUserId } = req.query;
  
  // Determine which user's history to fetch
  let targetUserId = req.user._id;
  if (requestedUserId && req.user.isAdmin) {
    targetUserId = requestedUserId;
  } else if (requestedUserId && !req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied. Admin privileges required to access other users history.' });
  }

  let filter = { user: targetUserId };
  if (analysisType && analysisType !== 'all') {
    filter.analysisType = analysisType;
  }
  if (isFavorite === 'true') {
    filter.isFavorite = true;
  }

  try {
    const analyses = await AiAnalysis.find(filter)
      .select('prompt analysisType createdAt dataUsed metadata isFavorite rating tags')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AiAnalysis.countDocuments(filter);

    res.json({
      analyses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching analysis history:', error);
    res.status(500);
    throw new Error('Failed to fetch analysis history');
  }
});

// @desc    Get a specific AI analysis
// @route   GET /api/ai-analysis/:id
// @access  Private
const getAnalysisById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUser = req.user;

  try {
    let query = { _id: id };
    
    // If not admin, only allow access to own analyses
    if (!currentUser.isAdmin) {
      query.user = currentUser._id;
    }
    
    const analysis = await AiAnalysis.findOne(query);

    if (!analysis) {
      res.status(404);
      throw new Error('Analysis not found');
    }

    res.json(analysis);
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500);
    throw new Error('Failed to fetch analysis');
  }
});

// @desc    Update AI analysis (favorite, rating, tags)
// @route   PUT /api/ai-analysis/:id
// @access  Private
const updateAnalysis = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isFavorite, rating, tags } = req.body;
  const currentUser = req.user;

  try {
    let query = { _id: id };
    
    // If not admin, only allow access to own analyses
    if (!currentUser.isAdmin) {
      query.user = currentUser._id;
    }
    
    const analysis = await AiAnalysis.findOne(query);

    if (!analysis) {
      res.status(404);
      throw new Error('Analysis not found');
    }

    // Update fields if provided
    if (typeof isFavorite === 'boolean') {
      analysis.isFavorite = isFavorite;
    }
    if (rating && rating >= 1 && rating <= 5) {
      analysis.rating = rating;
    }
    if (Array.isArray(tags)) {
      analysis.tags = tags;
    }

    await analysis.save();

    res.json({
      message: 'Analysis updated successfully',
      analysis: {
        id: analysis._id,
        isFavorite: analysis.isFavorite,
        rating: analysis.rating,
        tags: analysis.tags
      }
    });
  } catch (error) {
    console.error('Error updating analysis:', error);
    res.status(500);
    throw new Error('Failed to update analysis');
  }
});

// @desc    Delete AI analysis
// @route   DELETE /api/ai-analysis/:id
// @access  Private
const deleteAnalysis = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUser = req.user;

  try {
    let query = { _id: id };
    
    // If not admin, only allow access to own analyses
    if (!currentUser.isAdmin) {
      query.user = currentUser._id;
    }
    
    const analysis = await AiAnalysis.findOne(query);

    if (!analysis) {
      res.status(404);
      throw new Error('Analysis not found');
    }

    await AiAnalysis.deleteOne({ _id: id });

    res.json({ message: 'Analysis deleted successfully' });
  } catch (error) {
    console.error('Error deleting analysis:', error);
    res.status(500);
    throw new Error('Failed to delete analysis');
  }
});

// @desc    Get analysis statistics
// @route   GET /api/ai-analysis/stats
// @access  Private
const getAnalysisStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const stats = await AiAnalysis.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          favoriteCount: { $sum: { $cond: ['$isFavorite', 1, 0] } },
          avgRating: { $avg: '$rating' },
          totalResponseTime: { $sum: '$metadata.responseTime' },
          analysisTypeBreakdown: {
            $push: '$analysisType'
          }
        }
      }
    ]);

    const typeStats = await AiAnalysis.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$analysisType',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentActivity = await AiAnalysis.find({ user: userId })
      .select('createdAt analysisType')
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({
      overall: stats[0] || {
        totalAnalyses: 0,
        favoriteCount: 0,
        avgRating: 0,
        totalResponseTime: 0
      },
      byType: typeStats,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching analysis stats:', error);
    res.status(500);
    throw new Error('Failed to fetch analysis statistics');
  }
});

// @desc    Get AI service status and API key information
// @route   GET /api/ai-analysis/service-status
// @access  Private
const getServiceStatus = asyncHandler(async (req, res) => {
  try {
    const status = aiService.getStatus();
    const usageStats = aiService.getUsageStats();
    
    res.json({
      success: true,
      status,
      usageStats,
      message: `AI Service running with ${status.totalKeys} API key(s). Currently using key ${status.currentKeyIndex}.`
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to get service status: ${error.message}`);
  }
});

// @desc    Test all API keys
// @route   POST /api/ai-analysis/test-keys
// @access  Private
const testApiKeys = asyncHandler(async (req, res) => {
  try {
    console.log('🧪 Testing all API keys...');
    const testResults = await aiService.testAllKeys();
    
    res.json({
      success: true,
      testResults,
      summary: {
        totalKeys: testResults.length,
        workingKeys: testResults.filter(r => r.status === 'Working').length,
        failedKeys: testResults.filter(r => r.status === 'Failed').length
      }
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to test API keys: ${error.message}`);
  }
});

// @desc    Test AI service with a simple prompt
// @route   POST /api/ai-analysis/test-service
// @access  Private
const testAIService = asyncHandler(async (req, res) => {
  try {
    console.log('🧪 Testing AI service...');
    
    const testPrompt = "Respond with 'AI service is working correctly!' and nothing else.";
    const result = await aiService.generateContent(testPrompt);
    
    const serviceStatus = aiService.getStatus();
    
    res.json({
      success: true,
      result,
      serviceStatus,
      message: `Test successful! AI service responded using key ${serviceStatus.currentKeyIndex}.`
    });
  } catch (error) {
    console.error('AI service test failed:', error);
    res.status(500);
    throw new Error(`AI service test failed: ${error.message}`);
  }
});

export {
  getUserDataForAnalysis,
  analyzeUserData,
  getAnalysisHistory,
  getAnalysisById,
  updateAnalysis,
  deleteAnalysis,
  getAnalysisStats,
  getServiceStatus,
  testApiKeys,
  testAIService
};
