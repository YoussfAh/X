# 🚀 Multi-API Key System Documentation - Part 2

## 4. Controller Implementation

### 🎮 AI Analysis Controller

#### `controllers/aiAnalysisController.js` - Complete Implementation

```javascript
import asyncHandler from '../middleware/asyncHandler.js';
import aiService from '../utils/aiService.js';
import User from '../models/userModel.js';
import Meal from '../models/mealModel.js';
import Workout from '../models/workoutModel.js';
import AIAnalysis from '../models/aiAnalysisModel.js';

/**
 * @desc    Analyze user data with AI using multi-key system
 * @route   POST /api/ai-analysis/analyze
 * @access  Private
 */
const analyzeUserData = asyncHandler(async (req, res) => {
    try {
        const { dataTypes = ['all'], dateRange } = req.body;
        const userId = req.user._id;

        console.log(`🔍 Starting AI analysis for user: ${req.user.email}`);
        console.log(`📊 Data types: ${dataTypes.join(', ')}`);
        console.log(`📅 Date range: ${JSON.stringify(dateRange)}`);

        // Get user data based on requested types
        const userData = await getUserAnalysisData(userId, dataTypes, dateRange);
        
        if (!userData || Object.keys(userData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No data available for analysis. Please add some meals, workouts, or progress data first.',
                data: null
            });
        }

        // Create comprehensive analysis prompt
        const analysisPrompt = createAnalysisPrompt(userData, req.user);

        try {
            // Use multi-key AI service for analysis
            console.log('🤖 Sending request to AI service...');
            const aiResponse = await aiService.generateContent(analysisPrompt);
            
            // Parse and validate AI response
            const analysisData = parseAIResponse(aiResponse);
            
            // Save analysis to database
            console.log('💾 Attempting to save analysis to database for user:', userId);
            const analysis = new AIAnalysis({
                user: userId,
                analysisData,
                dataTypes,
                dateRange,
                rawResponse: aiResponse,
                generatedAt: new Date()
            });

            await analysis.save();
            console.log('✅ Analysis saved successfully with ID:', analysis._id);

            res.json({
                success: true,
                message: 'AI analysis completed successfully',
                data: {
                    analysis: analysisData,
                    metadata: {
                        analysisId: analysis._id,
                        dataTypes,
                        dateRange,
                        generatedAt: analysis.generatedAt,
                        activeApiKey: aiService.getStatus().currentKeyIndex
                    }
                }
            });

        } catch (aiError) {
            console.error('🚨 AI analysis error:', aiError.message);
            
            // Return user-friendly error based on AI service error
            let errorMessage = 'AI analysis temporarily unavailable. Please try again in a moment.';
            let errorCode = 'AI_SERVICE_ERROR';

            if (aiError.message.includes('ALL API QUOTA EXCEEDED')) {
                errorMessage = 'AI service quota exceeded for today. Please try again tomorrow or contact support for higher limits.';
                errorCode = 'QUOTA_EXCEEDED';
            } else if (aiError.message.includes('ALL API KEYS INVALID')) {
                errorMessage = 'AI service configuration error. Please contact support.';
                errorCode = 'INVALID_KEYS';
            } else if (aiError.message.includes('PARTIAL QUOTA EXCEEDED')) {
                errorMessage = 'Some AI services are at capacity, but analysis should still work. If this persists, please try again later.';
                errorCode = 'PARTIAL_QUOTA';
            }

            return res.status(503).json({
                success: false,
                message: errorMessage,
                error: errorCode,
                details: aiError.message,
                data: null
            });
        }

    } catch (error) {
        console.error('💥 Unexpected error in AI analysis:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during analysis',
            error: error.message,
            data: null
        });
    }
});

/**
 * @desc    Get AI service status and key information
 * @route   GET /api/ai-analysis/service-status
 * @access  Private
 */
const getServiceStatus = asyncHandler(async (req, res) => {
    try {
        const status = aiService.getStatus();
        const usageStats = aiService.getUsageStats();

        res.json({
            success: true,
            message: 'Service status retrieved successfully',
            data: {
                ...status,
                usageStatistics: usageStats,
                serviceHealth: aiService.hasAvailableKeys() ? 'healthy' : 'degraded',
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error getting service status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve service status',
            error: error.message
        });
    }
});

/**
 * @desc    Test all configured API keys
 * @route   POST /api/ai-analysis/test-keys
 * @access  Private (Admin recommended)
 */
const testApiKeys = asyncHandler(async (req, res) => {
    try {
        console.log('🧪 Testing all API keys...');
        const testResults = await aiService.testAllKeys();

        const summary = {
            totalKeys: testResults.length,
            workingKeys: testResults.filter(r => r.status === 'Working').length,
            failedKeys: testResults.filter(r => r.status === 'Failed').length,
            notInitialized: testResults.filter(r => r.status === 'Not initialized').length
        };

        res.json({
            success: true,
            message: 'API key testing completed',
            data: {
                summary,
                detailedResults: testResults,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error testing API keys:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to test API keys',
            error: error.message
        });
    }
});

/**
 * @desc    Test AI service with a simple request
 * @route   POST /api/ai-analysis/test-service
 * @access  Private
 */
const testAIService = asyncHandler(async (req, res) => {
    try {
        const testPrompt = req.body.prompt || "Respond with 'AI service is working correctly' and the current time.";
        
        console.log('🔬 Testing AI service with prompt:', testPrompt);
        const startTime = Date.now();
        
        const response = await aiService.generateContent(testPrompt);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        const currentStatus = aiService.getStatus();

        res.json({
            success: true,
            message: 'AI service test completed successfully',
            data: {
                response,
                responseTime: `${responseTime}ms`,
                activeKey: currentStatus.currentKeyIndex,
                serviceStatus: currentStatus,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('AI service test failed:', error);
        res.status(503).json({
            success: false,
            message: 'AI service test failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Helper function to get user data for analysis
 */
async function getUserAnalysisData(userId, dataTypes, dateRange) {
    const userData = {};
    
    // Set up date filtering
    const dateFilter = {};
    if (dateRange && dateRange.startDate && dateRange.endDate) {
        dateFilter.createdAt = {
            $gte: new Date(dateRange.startDate),
            $lte: new Date(dateRange.endDate)
        };
    }

    // Get meal data
    if (dataTypes.includes('all') || dataTypes.includes('meals')) {
        const meals = await Meal.find({
            user: userId,
            ...dateFilter
        }).sort({ createdAt: -1 }).limit(50);
        
        userData.mealData = meals.map(meal => ({
            date: meal.createdAt.toISOString().split('T')[0],
            meal: meal.mealType || 'meal',
            items: meal.foodItems.map(item => item.name),
            calories: meal.calories || 0,
            macros: meal.macros
        }));
    }

    // Get workout data
    if (dataTypes.includes('all') || dataTypes.includes('workouts')) {
        const workouts = await Workout.find({
            user: userId,
            ...dateFilter
        }).sort({ createdAt: -1 }).limit(30);
        
        userData.workoutData = workouts.map(workout => ({
            date: workout.createdAt.toISOString().split('T')[0],
            type: workout.type,
            duration: workout.duration,
            intensity: workout.intensity,
            exercises: workout.exercises?.map(ex => ({
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                weight: ex.weight
            }))
        }));
    }

    // Get progress data (if you have a Progress model)
    if (dataTypes.includes('all') || dataTypes.includes('progress')) {
        // Add progress data logic here if you have a Progress model
        userData.progressData = {
            weight: [], // Add weight tracking data
            bodyFat: [], // Add body fat data
            measurements: [] // Add body measurements
        };
    }

    return userData;
}

/**
 * Create comprehensive analysis prompt
 */
function createAnalysisPrompt(userData, user) {
    return `
You are a professional fitness and nutrition AI analyst. Analyze the following user data and provide comprehensive insights.

User Profile:
- Name: ${user.name}
- Email: ${user.email}
- Goals: ${user.fitnessGoals || 'General health and fitness'}

Data to Analyze:
${JSON.stringify(userData, null, 2)}

Please provide a detailed analysis in the following JSON format:
{
    "summary": "Overall summary of the user's fitness and nutrition patterns",
    "nutrition": {
        "analysis": "Detailed nutrition analysis",
        "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
        "strengths": ["strength1", "strength2"],
        "areasForImprovement": ["area1", "area2"]
    },
    "fitness": {
        "analysis": "Detailed fitness analysis",
        "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
        "strengths": ["strength1", "strength2"],
        "areasForImprovement": ["area1", "area2"]
    },
    "goals": {
        "progress": "Assessment of progress toward stated goals",
        "adjustments": "Suggested goal adjustments if any"
    },
    "actionPlan": {
        "immediate": ["immediate action 1", "immediate action 2"],
        "shortTerm": ["short term goal 1", "short term goal 2"],
        "longTerm": ["long term goal 1", "long term goal 2"]
    },
    "score": {
        "nutrition": 85,
        "fitness": 78,
        "overall": 82
    }
}

Ensure the response is valid JSON and provides actionable, personalized advice.
`;
}

/**
 * Parse and validate AI response
 */
function parseAIResponse(aiResponse) {
    try {
        // Try to parse as JSON
        const parsed = JSON.parse(aiResponse);
        return parsed;
    } catch (error) {
        // If not valid JSON, create a structured response
        console.warn('AI response is not valid JSON, creating structured response');
        return {
            summary: aiResponse.substring(0, 500) + '...',
            nutrition: {
                analysis: "AI analysis could not be parsed properly",
                recommendations: ["Please review your nutrition data"],
                strengths: [],
                areasForImprovement: []
            },
            fitness: {
                analysis: "AI analysis could not be parsed properly", 
                recommendations: ["Please review your fitness data"],
                strengths: [],
                areasForImprovement: []
            },
            rawResponse: aiResponse
        };
    }
}

// Export all controller functions
export {
    analyzeUserData,
    getServiceStatus,
    testApiKeys,
    testAIService,
    getUserDataForAnalysis,
    getAnalysisHistory,
    getAnalysisById,
    updateAnalysis,
    deleteAnalysis,
    getAnalysisStats
};
```

### 🛣️ Routes Configuration

#### `routes/aiAnalysisRoutes.js` - Complete Routes Setup

```javascript
import express from 'express';
import {
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
} from '../controllers/aiAnalysisController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// User data and analysis endpoints
router.route('/user-data')
    .get(protect, getUserDataForAnalysis);

router.route('/analyze')
    .post(protect, analyzeUserData);

router.route('/history')
    .get(protect, getAnalysisHistory);

router.route('/stats')
    .get(protect, getAnalysisStats);

// Multi-API Key System Monitoring Endpoints
router.route('/service-status')
    .get(protect, getServiceStatus);

router.route('/test-keys')
    .post(protect, admin, testApiKeys); // Admin only for security

router.route('/test-service')
    .post(protect, testAIService);

// Individual analysis operations
router.route('/:id')
    .get(protect, getAnalysisById)
    .put(protect, updateAnalysis)
    .delete(protect, deleteAnalysis);

export default router;
```

### 🗄️ Database Models

#### `models/aiAnalysisModel.js` - Analysis Storage Model

```javascript
import mongoose from 'mongoose';

const aiAnalysisSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    analysisData: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    dataTypes: [{
        type: String,
        enum: ['meals', 'workouts', 'progress', 'all'],
        default: 'all'
    }],
    dateRange: {
        startDate: Date,
        endDate: Date
    },
    rawResponse: {
        type: String,
        required: true
    },
    apiKeyUsed: {
        type: Number, // Which API key was used (1, 2, or 3)
        required: false
    },
    processingTime: {
        type: Number, // Processing time in milliseconds
        required: false
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient queries
aiAnalysisSchema.index({ user: 1, generatedAt: -1 });
aiAnalysisSchema.index({ user: 1, dataTypes: 1 });

const AIAnalysis = mongoose.model('AIAnalysis', aiAnalysisSchema);

export default AIAnalysis;
```

---

## 5. Frontend Integration

### 🎨 Service Status Component

#### `components/aiAnalysis/ServiceStatusComponent.jsx` - Real-time Status Display

```javascript
import React, { useState, useEffect } from 'react';
import { 
    Card, 
    CardContent, 
    Typography, 
    Box, 
    Chip, 
    Button, 
    Grid, 
    CircularProgress,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    LinearProgress
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Refresh as RefreshIcon,
    Speed as SpeedIcon
} from '@mui/icons-material';
import { 
    useGetServiceStatusQuery,
    useTestApiKeysMutation,
    useTestAiServiceMutation 
} from '../../slices/aiAnalysisApiSlice';

/**
 * Component to display real-time AI service status and multi-key information
 */
const ServiceStatusComponent = ({ showDetailed = true }) => {
    const [expanded, setExpanded] = useState(false);
    const [testResults, setTestResults] = useState(null);

    // RTK Query hooks
    const {
        data: statusData,
        isLoading: statusLoading,
        error: statusError,
        refetch: refetchStatus
    } = useGetServiceStatusQuery(undefined, {
        pollingInterval: 30000 // Refresh every 30 seconds
    });

    const [testKeys, { isLoading: testingKeys }] = useTestApiKeysMutation();
    const [testService, { isLoading: testingService }] = useTestAiServiceMutation();

    // Handle key testing
    const handleTestKeys = async () => {
        try {
            const result = await testKeys().unwrap();
            setTestResults(result.data);
        } catch (error) {
            console.error('Key testing failed:', error);
        }
    };

    // Handle service testing
    const handleTestService = async () => {
        try {
            const result = await testService({ 
                prompt: "Test the AI service responsiveness" 
            }).unwrap();
            console.log('Service test result:', result);
        } catch (error) {
            console.error('Service test failed:', error);
        }
    };

    // Get status color based on service health
    const getStatusColor = (health) => {
        switch (health) {
            case 'healthy': return 'success';
            case 'degraded': return 'warning';
            default: return 'error';
        }
    };

    // Get key status icon
    const getKeyStatusIcon = (key) => {
        if (key.quotaExceeded) return <ErrorIcon color="error" />;
        if (key.isInitialized) return <CheckCircleIcon color="success" />;
        return <WarningIcon color="warning" />;
    };

    if (statusLoading) {
        return (
            <Card>
                <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                        <CircularProgress size={24} />
                        <Typography>Loading AI service status...</Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    if (statusError) {
        return (
            <Card>
                <CardContent>
                    <Alert severity="error">
                        Failed to load AI service status: {statusError.message}
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    const status = statusData?.data;
    if (!status) return null;

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                {/* Header Status */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" component="h2">
                        🤖 AI Service Status
                    </Typography>
                    <Box display="flex" gap={1} alignItems="center">
                        <Chip 
                            label={status.serviceHealth || 'unknown'}
                            color={getStatusColor(status.serviceHealth)}
                            size="small"
                        />
                        <Button
                            size="small"
                            startIcon={<RefreshIcon />}
                            onClick={refetchStatus}
                            disabled={statusLoading}
                        >
                            Refresh
                        </Button>
                    </Box>
                </Box>

                {/* Current Status Overview */}
                <Grid container spacing={2} mb={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box textAlign="center">
                            <Typography variant="h4" color="primary">
                                {status.totalKeys}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Total API Keys
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box textAlign="center">
                            <Typography variant="h4" color="success.main">
                                {status.currentKeyIndex}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Active Key
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box textAlign="center">
                            <Typography variant="h4" color="info.main">
                                {status.availableKeys?.filter(k => !k.quotaExceeded).length || 0}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Available Keys
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box textAlign="center">
                            <Typography variant="h4" color="error.main">
                                {status.availableKeys?.filter(k => k.quotaExceeded).length || 0}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Quota Exceeded
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>

                {/* Detailed View */}
                {showDetailed && (
                    <Accordion 
                        expanded={expanded} 
                        onChange={(e, isExpanded) => setExpanded(isExpanded)}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Detailed Key Information</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={2}>
                                {status.availableKeys?.map((key, index) => (
                                    <Grid item xs={12} md={6} lg={4} key={index}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Box display="flex" alignItems="center" mb={1}>
                                                    {getKeyStatusIcon(key)}
                                                    <Typography variant="h6" ml={1}>
                                                        API Key {key.keyNumber}
                                                        {key.keyNumber === status.currentKeyIndex && (
                                                            <Chip 
                                                                label="Active" 
                                                                size="small" 
                                                                color="primary" 
                                                                sx={{ ml: 1 }}
                                                            />
                                                        )}
                                                    </Typography>
                                                </Box>
                                                
                                                <Typography variant="body2" gutterBottom>
                                                    Key: {key.keyPreview}
                                                </Typography>
                                                
                                                <Box mb={1}>
                                                    <Typography variant="body2">
                                                        Success Rate: {key.successRate || 0}%
                                                    </Typography>
                                                    <LinearProgress 
                                                        variant="determinate" 
                                                        value={key.successRate || 0}
                                                        color={key.successRate > 80 ? 'success' : key.successRate > 50 ? 'warning' : 'error'}
                                                    />
                                                </Box>

                                                <Typography variant="body2">
                                                    Requests: {key.requestCount || 0} | 
                                                    Success: {key.successCount || 0} |
                                                    Errors: {key.errorCount || 0}
                                                </Typography>

                                                {key.quotaExceeded && (
                                                    <Alert severity="error" sx={{ mt: 1 }}>
                                                        Quota exceeded - resets in ~24h
                                                    </Alert>
                                                )}

                                                {key.lastUsed && (
                                                    <Typography variant="caption" display="block" mt={1}>
                                                        Last used: {new Date(key.lastUsed).toLocaleString()}
                                                    </Typography>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>

                            {/* Testing Controls */}
                            <Box mt={3} display="flex" gap={2} flexWrap="wrap">
                                <Button
                                    variant="outlined"
                                    startIcon={<SpeedIcon />}
                                    onClick={handleTestKeys}
                                    disabled={testingKeys}
                                >
                                    {testingKeys ? 'Testing Keys...' : 'Test All Keys'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<CheckCircleIcon />}
                                    onClick={handleTestService}
                                    disabled={testingService}
                                >
                                    {testingService ? 'Testing Service...' : 'Test AI Service'}
                                </Button>
                            </Box>

                            {/* Test Results */}
                            {testResults && (
                                <Box mt={2}>
                                    <Typography variant="h6" gutterBottom>
                                        Test Results
                                    </Typography>
                                    <Alert 
                                        severity={testResults.summary?.workingKeys > 0 ? 'success' : 'error'}
                                        sx={{ mb: 2 }}
                                    >
                                        {testResults.summary?.workingKeys} of {testResults.summary?.totalKeys} keys working
                                    </Alert>
                                    {testResults.detailedResults?.map((result, index) => (
                                        <Alert 
                                            key={index}
                                            severity={result.status === 'Working' ? 'success' : 'error'}
                                            sx={{ mb: 1 }}
                                        >
                                            Key {result.keyNumber}: {result.status} 
                                            {result.error && ` - ${result.error}`}
                                        </Alert>
                                    ))}
                                </Box>
                            )}
                        </AccordionDetails>
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
};

export default ServiceStatusComponent;
```
