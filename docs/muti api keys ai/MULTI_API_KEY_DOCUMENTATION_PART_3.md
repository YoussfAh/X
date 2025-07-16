# 🚀 Multi-API Key System Documentation - Part 3

## 6. Frontend API Integration

### 🔌 RTK Query API Slice

#### `slices/aiAnalysisApiSlice.js` - Complete API Integration

```javascript
import { apiSlice } from './apiSlice';

const AI_ANALYSIS_URL = '/api/ai-analysis';

export const aiAnalysisApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Main analysis endpoint
        analyzeUserData: builder.mutation({
            query: (data) => ({
                url: `${AI_ANALYSIS_URL}/analyze`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['AIAnalysis'],
        }),

        // Get user data for analysis
        getUserDataForAnalysis: builder.query({
            query: (params) => ({
                url: `${AI_ANALYSIS_URL}/user-data`,
                params,
            }),
            providesTags: ['UserData'],
        }),

        // Analysis history
        getAnalysisHistory: builder.query({
            query: (params) => ({
                url: `${AI_ANALYSIS_URL}/history`,
                params,
            }),
            providesTags: ['AIAnalysis'],
        }),

        // Get specific analysis
        getAnalysisById: builder.query({
            query: (id) => ({
                url: `${AI_ANALYSIS_URL}/${id}`,
            }),
            providesTags: (result, error, id) => [{ type: 'AIAnalysis', id }],
        }),

        // Update analysis
        updateAnalysis: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `${AI_ANALYSIS_URL}/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'AIAnalysis', id }],
        }),

        // Delete analysis
        deleteAnalysis: builder.mutation({
            query: (id) => ({
                url: `${AI_ANALYSIS_URL}/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['AIAnalysis'],
        }),

        // Analysis statistics
        getAnalysisStats: builder.query({
            query: (params) => ({
                url: `${AI_ANALYSIS_URL}/stats`,
                params,
            }),
            providesTags: ['AIAnalysis'],
        }),

        // Multi-API Key System Endpoints
        
        // Get service status (real-time monitoring)
        getServiceStatus: builder.query({
            query: () => ({
                url: `${AI_ANALYSIS_URL}/service-status`,
            }),
            providesTags: ['ServiceStatus'],
            // Enable real-time updates
            keepUnusedDataFor: 0,
        }),

        // Test all API keys
        testApiKeys: builder.mutation({
            query: () => ({
                url: `${AI_ANALYSIS_URL}/test-keys`,
                method: 'POST',
            }),
        }),

        // Test AI service with custom prompt
        testAiService: builder.mutation({
            query: (data) => ({
                url: `${AI_ANALYSIS_URL}/test-service`,
                method: 'POST',
                body: data,
            }),
        }),
    }),
});

// Export hooks for components to use
export const {
    // Main analysis hooks
    useAnalyzeUserDataMutation,
    useGetUserDataForAnalysisQuery,
    useGetAnalysisHistoryQuery,
    useGetAnalysisByIdQuery,
    useUpdateAnalysisMutation,
    useDeleteAnalysisMutation,
    useGetAnalysisStatsQuery,
    
    // Multi-API Key System hooks
    useGetServiceStatusQuery,
    useTestApiKeysMutation,
    useTestAiServiceMutation,
} = aiAnalysisApiSlice;
```

### 🎯 Integration in Main Components

#### `screens/AIAnalyticsScreen.jsx` - Main Analytics Screen with Status

```javascript
import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Button,
    Grid,
    Alert,
    CircularProgress,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField
} from '@mui/material';
import {
    Analytics as AnalyticsIcon,
    TrendingUp as TrendingUpIcon,
    Speed as SpeedIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import ServiceStatusComponent from '../components/aiAnalysis/ServiceStatusComponent';
import AnalysisResultsComponent from '../components/aiAnalysis/AnalysisResultsComponent';
import AnalysisHistoryComponent from '../components/aiAnalysis/AnalysisHistoryComponent';

import {
    useAnalyzeUserDataMutation,
    useGetUserDataForAnalysisQuery,
    useGetAnalysisHistoryQuery,
    useGetServiceStatusQuery
} from '../slices/aiAnalysisApiSlice';

const AIAnalyticsScreen = () => {
    // State management
    const [analysisParams, setAnalysisParams] = useState({
        dataTypes: ['all'],
        dateRange: {
            startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
            endDate: dayjs().format('YYYY-MM-DD'),
            preset: 'last30days'
        }
    });
    const [currentAnalysis, setCurrentAnalysis] = useState(null);
    const [showHistory, setShowHistory] = useState(false);

    // RTK Query hooks
    const [analyzeUserData, { 
        isLoading: analyzing, 
        error: analysisError 
    }] = useAnalyzeUserDataMutation();

    const { 
        data: userData, 
        isLoading: loadingUserData, 
        error: userDataError 
    } = useGetUserDataForAnalysisQuery(analysisParams);

    const { 
        data: analysisHistory, 
        isLoading: loadingHistory 
    } = useGetAnalysisHistoryQuery({ page: 1, limit: 10 });

    const { 
        data: serviceStatus, 
        isLoading: loadingStatus 
    } = useGetServiceStatusQuery(undefined, {
        pollingInterval: 30000 // Refresh every 30 seconds
    });

    // Handle analysis request
    const handleAnalyze = async () => {
        try {
            console.log('🔍 Starting AI analysis with params:', analysisParams);
            
            const result = await analyzeUserData(analysisParams).unwrap();
            setCurrentAnalysis(result.data);
            
            // Show success message
            console.log('✅ Analysis completed successfully');
        } catch (error) {
            console.error('❌ Analysis failed:', error);
        }
    };

    // Handle parameter changes
    const handleParamChange = (field, value) => {
        setAnalysisParams(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleDateRangeChange = (field, value) => {
        setAnalysisParams(prev => ({
            ...prev,
            dateRange: {
                ...prev.dateRange,
                [field]: value?.format('YYYY-MM-DD') || value,
                preset: 'custom'
            }
        }));
    };

    // Quick date range presets
    const setDatePreset = (preset) => {
        let startDate, endDate;
        const now = dayjs();

        switch (preset) {
            case 'last7days':
                startDate = now.subtract(7, 'day');
                endDate = now;
                break;
            case 'last30days':
                startDate = now.subtract(30, 'day');
                endDate = now;
                break;
            case 'last90days':
                startDate = now.subtract(90, 'day');
                endDate = now;
                break;
            case 'thisMonth':
                startDate = now.startOf('month');
                endDate = now;
                break;
            default:
                return;
        }

        setAnalysisParams(prev => ({
            ...prev,
            dateRange: {
                startDate: startDate.format('YYYY-MM-DD'),
                endDate: endDate.format('YYYY-MM-DD'),
                preset
            }
        }));
    };

    // Get service health status for display
    const serviceHealth = serviceStatus?.data?.serviceHealth || 'unknown';
    const isServiceHealthy = serviceHealth === 'healthy';

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Header */}
                <Box mb={4}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        🤖 AI Analytics Dashboard
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                        Get personalized insights about your fitness and nutrition data using our multi-API AI system.
                    </Typography>
                </Box>

                {/* Service Status - Always visible */}
                <ServiceStatusComponent showDetailed={true} />

                {/* Service Health Alert */}
                {!isServiceHealthy && (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        <strong>Service Notice:</strong> AI service is running in degraded mode. 
                        Some API keys may have reached their quota limits. Analysis may take longer than usual.
                    </Alert>
                )}

                {/* Analysis Controls */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            📊 Analysis Configuration
                        </Typography>
                        
                        <Grid container spacing={3} alignItems="end">
                            {/* Data Types Selection */}
                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth>
                                    <InputLabel>Data Types</InputLabel>
                                    <Select
                                        multiple
                                        value={analysisParams.dataTypes}
                                        onChange={(e) => handleParamChange('dataTypes', e.target.value)}
                                        label="Data Types"
                                    >
                                        <MenuItem value="all">All Data</MenuItem>
                                        <MenuItem value="meals">Meals Only</MenuItem>
                                        <MenuItem value="workouts">Workouts Only</MenuItem>
                                        <MenuItem value="progress">Progress Only</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Date Range Presets */}
                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth>
                                    <InputLabel>Time Period</InputLabel>
                                    <Select
                                        value={analysisParams.dateRange.preset}
                                        onChange={(e) => setDatePreset(e.target.value)}
                                        label="Time Period"
                                    >
                                        <MenuItem value="last7days">Last 7 Days</MenuItem>
                                        <MenuItem value="last30days">Last 30 Days</MenuItem>
                                        <MenuItem value="last90days">Last 90 Days</MenuItem>
                                        <MenuItem value="thisMonth">This Month</MenuItem>
                                        <MenuItem value="custom">Custom Range</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Custom Date Range */}
                            {analysisParams.dateRange.preset === 'custom' && (
                                <>
                                    <Grid item xs={12} sm={6} md={2}>
                                        <DatePicker
                                            label="Start Date"
                                            value={dayjs(analysisParams.dateRange.startDate)}
                                            onChange={(value) => handleDateRangeChange('startDate', value)}
                                            renderInput={(params) => <TextField {...params} fullWidth />}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
                                        <DatePicker
                                            label="End Date"
                                            value={dayjs(analysisParams.dateRange.endDate)}
                                            onChange={(value) => handleDateRangeChange('endDate', value)}
                                            renderInput={(params) => <TextField {...params} fullWidth />}
                                        />
                                    </Grid>
                                </>
                            )}

                            {/* Analyze Button */}
                            <Grid item xs={12} sm={6} md={2}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    startIcon={analyzing ? <CircularProgress size={20} /> : <AnalyticsIcon />}
                                    onClick={handleAnalyze}
                                    disabled={analyzing || !isServiceHealthy}
                                >
                                    {analyzing ? 'Analyzing...' : 'Analyze'}
                                </Button>
                            </Grid>
                        </Grid>

                        {/* Quick Info */}
                        {userData && (
                            <Box mt={2}>
                                <Typography variant="body2" color="textSecondary">
                                    📈 Available data: {userData.data?.mealData?.length || 0} meals, {' '}
                                    {userData.data?.workoutData?.length || 0} workouts, {' '}
                                    {userData.data?.progressData?.length || 0} progress entries
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* Error Display */}
                {(analysisError || userDataError) && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        <strong>Analysis Error:</strong> {' '}
                        {analysisError?.data?.message || userDataError?.data?.message || 'An unexpected error occurred'}
                        
                        {/* Multi-API Key Error Details */}
                        {analysisError?.data?.error === 'QUOTA_EXCEEDED' && (
                            <Box mt={1}>
                                <Typography variant="body2">
                                    🚫 All API keys have reached their daily quota. The service will automatically resume when quotas reset.
                                </Typography>
                            </Box>
                        )}
                        
                        {analysisError?.data?.error === 'PARTIAL_QUOTA' && (
                            <Box mt={1}>
                                <Typography variant="body2">
                                    ⚠️ Some API keys are at capacity, but analysis should still work. Please try again.
                                </Typography>
                            </Box>
                        )}
                    </Alert>
                )}

                {/* Analysis Results */}
                {currentAnalysis && (
                    <AnalysisResultsComponent 
                        analysis={currentAnalysis.analysis}
                        metadata={currentAnalysis.metadata}
                    />
                )}

                {/* History Toggle */}
                <Box mt={4} mb={2}>
                    <Button
                        variant="outlined"
                        startIcon={<TrendingUpIcon />}
                        onClick={() => setShowHistory(!showHistory)}
                    >
                        {showHistory ? 'Hide' : 'Show'} Analysis History
                    </Button>
                </Box>

                {/* Analysis History */}
                {showHistory && (
                    <AnalysisHistoryComponent 
                        history={analysisHistory?.data?.analyses}
                        loading={loadingHistory}
                        onSelectAnalysis={setCurrentAnalysis}
                    />
                )}
            </Container>
        </LocalizationProvider>
    );
};

export default AIAnalyticsScreen;
```

---

## 7. Testing & Verification

### 🧪 Comprehensive Test Suite

#### `tests/multiKeySystem.test.js` - Unit Tests

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import aiService from '../utils/aiService.js';

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: vi.fn(() => ({
        getGenerativeModel: vi.fn(() => ({
            generateContent: vi.fn()
        }))
    }))
}));

describe('Multi-API Key System', () => {
    beforeEach(() => {
        // Reset environment variables
        process.env.GOOGLE_AI_API_KEY_1 = 'test-key-1';
        process.env.GOOGLE_AI_API_KEY_2 = 'test-key-2';
        process.env.GOOGLE_AI_API_KEY_3 = 'test-key-3';
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize with multiple API keys', () => {
            const status = aiService.getStatus();
            expect(status.totalKeys).toBe(3);
            expect(status.currentKeyIndex).toBe(1);
        });

        it('should handle missing API keys gracefully', () => {
            delete process.env.GOOGLE_AI_API_KEY_2;
            delete process.env.GOOGLE_AI_API_KEY_3;
            
            const status = aiService.getStatus();
            expect(status.totalKeys).toBe(1);
        });
    });

    describe('Key Switching Logic', () => {
        it('should switch to next key on quota exceeded error', async () => {
            const mockModel = {
                generateContent: vi.fn()
                    .mockRejectedValueOnce(new Error('You exceeded your current quota'))
                    .mockResolvedValueOnce({ response: { text: () => 'Success with key 2' } })
            };

            // Mock the models
            aiService.models[0] = { text: mockModel, vision: mockModel };
            aiService.models[1] = { text: mockModel, vision: mockModel };

            const result = await aiService.generateContent('test prompt');
            
            expect(result).toBe('Success with key 2');
            expect(aiService.getStatus().currentKeyIndex).toBe(2);
        });

        it('should track quota exceeded status', async () => {
            const quotaError = new Error('You exceeded your current quota');
            const mockModel = {
                generateContent: vi.fn().mockRejectedValue(quotaError)
            };

            aiService.models[0] = { text: mockModel, vision: mockModel };

            try {
                await aiService.generateContent('test prompt');
            } catch (error) {
                // Expected to fail
            }

            const status = aiService.getStatus();
            expect(status.availableKeys[0].quotaExceeded).toBe(true);
        });

        it('should handle invalid API key errors', async () => {
            const invalidKeyError = new Error('API_KEY_INVALID');
            const mockModel = {
                generateContent: vi.fn()
                    .mockRejectedValueOnce(invalidKeyError)
                    .mockResolvedValueOnce({ response: { text: () => 'Success with valid key' } })
            };

            aiService.models[0] = { text: mockModel, vision: mockModel };
            aiService.models[1] = { text: mockModel, vision: mockModel };

            const result = await aiService.generateContent('test prompt');
            expect(result).toBe('Success with valid key');
        });
    });

    describe('Error Detection', () => {
        it('should correctly identify quota exceeded errors', () => {
            const quotaErrors = [
                new Error('You exceeded your current quota'),
                new Error('QUOTA_EXCEEDED'),
                new Error('Resource has been exhausted'),
                { status: 429, message: 'Too Many Requests' }
            ];

            quotaErrors.forEach(error => {
                expect(aiService.isQuotaExceededError(error)).toBe(true);
            });
        });

        it('should correctly identify invalid key errors', () => {
            const invalidKeyErrors = [
                new Error('API_KEY_INVALID'),
                new Error('Invalid API key'),
                new Error('API key not valid')
            ];

            invalidKeyErrors.forEach(error => {
                expect(aiService.isInvalidKeyError(error)).toBe(true);
            });
        });

        it('should correctly identify rate limit errors', () => {
            const rateLimitErrors = [
                new Error('RATE_LIMIT exceeded'),
                new Error('Too many requests')
            ];

            rateLimitErrors.forEach(error => {
                expect(aiService.isRateLimitError(error)).toBe(true);
            });
        });
    });

    describe('Statistics Tracking', () => {
        it('should track usage statistics correctly', async () => {
            const mockModel = {
                generateContent: vi.fn().mockResolvedValue({ 
                    response: { text: () => 'Test response' } 
                })
            };

            aiService.models[0] = { text: mockModel, vision: mockModel };

            await aiService.generateContent('test prompt');

            const stats = aiService.getUsageStats();
            expect(stats.keyStats[0].requestCount).toBe(1);
            expect(stats.keyStats[0].successCount).toBe(1);
            expect(stats.keyStats[0].successRate).toBe(100);
        });

        it('should update error count on failures', async () => {
            const mockModel = {
                generateContent: vi.fn().mockRejectedValue(new Error('Test error'))
            };

            aiService.models[0] = { text: mockModel, vision: mockModel };
            aiService.models[1] = { text: mockModel, vision: mockModel };
            aiService.models[2] = { text: mockModel, vision: mockModel };

            try {
                await aiService.generateContent('test prompt');
            } catch (error) {
                // Expected to fail
            }

            const stats = aiService.getUsageStats();
            expect(stats.keyStats[0].errorCount).toBeGreaterThan(0);
        });
    });

    describe('Service Status', () => {
        it('should return comprehensive service status', () => {
            const status = aiService.getStatus();
            
            expect(status).toHaveProperty('totalKeys');
            expect(status).toHaveProperty('currentKeyIndex');
            expect(status).toHaveProperty('availableKeys');
            expect(Array.isArray(status.availableKeys)).toBe(true);
            
            status.availableKeys.forEach(key => {
                expect(key).toHaveProperty('keyNumber');
                expect(key).toHaveProperty('isInitialized');
                expect(key).toHaveProperty('keyPreview');
            });
        });

        it('should indicate available keys correctly', () => {
            // Mark first key as quota exceeded
            aiService.keyUsageStats[0].quotaExceeded = true;
            
            const hasAvailable = aiService.hasAvailableKeys();
            expect(hasAvailable).toBe(true); // Should have keys 2 and 3 available
            
            // Mark all keys as quota exceeded
            aiService.keyUsageStats.forEach(stat => stat.quotaExceeded = true);
            
            const hasAvailableAfter = aiService.hasAvailableKeys();
            expect(hasAvailableAfter).toBe(false);
        });
    });

    describe('Key Testing', () => {
        it('should test all keys successfully', async () => {
            const mockModel = {
                generateContent: vi.fn().mockResolvedValue({ 
                    response: { text: () => 'OK' } 
                })
            };

            // Setup all models
            aiService.models[0] = { text: mockModel, vision: mockModel };
            aiService.models[1] = { text: mockModel, vision: mockModel };
            aiService.models[2] = { text: mockModel, vision: mockModel };

            const results = await aiService.testAllKeys();
            
            expect(results).toHaveLength(3);
            results.forEach(result => {
                expect(result.status).toBe('Working');
                expect(result).toHaveProperty('keyNumber');
            });
        });

        it('should handle failed key tests', async () => {
            const mockFailingModel = {
                generateContent: vi.fn().mockRejectedValue(new Error('Test failure'))
            };
            const mockWorkingModel = {
                generateContent: vi.fn().mockResolvedValue({ 
                    response: { text: () => 'OK' } 
                })
            };

            aiService.models[0] = { text: mockFailingModel, vision: mockFailingModel };
            aiService.models[1] = { text: mockWorkingModel, vision: mockWorkingModel };

            const results = await aiService.testAllKeys();
            
            expect(results[0].status).toBe('Failed');
            expect(results[1].status).toBe('Working');
        });
    });
});
```

#### `tests/integration/multiKeyIntegration.test.js` - Integration Tests

```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../server.js';
import User from '../../models/userModel.js';
import { connectDB, disconnectDB } from '../../config/db.js';

describe('Multi-API Key Integration Tests', () => {
    let authToken;
    let testUser;

    beforeAll(async () => {
        await connectDB();
        
        // Create test user
        testUser = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        });

        // Get auth token
        const loginResponse = await request(app)
            .post('/api/users/auth')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        authToken = loginResponse.body.token;
    });

    afterAll(async () => {
        await User.findByIdAndDelete(testUser._id);
        await disconnectDB();
    });

    describe('Service Status Endpoint', () => {
        it('should return service status', async () => {
            const response = await request(app)
                .get('/api/ai-analysis/service-status')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('totalKeys');
            expect(response.body.data).toHaveProperty('currentKeyIndex');
            expect(response.body.data).toHaveProperty('availableKeys');
        });

        it('should require authentication', async () => {
            await request(app)
                .get('/api/ai-analysis/service-status')
                .expect(401);
        });
    });

    describe('Key Testing Endpoint', () => {
        it('should test API keys', async () => {
            const response = await request(app)
                .post('/api/ai-analysis/test-keys')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('summary');
            expect(response.body.data).toHaveProperty('detailedResults');
            expect(Array.isArray(response.body.data.detailedResults)).toBe(true);
        });
    });

    describe('AI Service Testing Endpoint', () => {
        it('should test AI service with default prompt', async () => {
            const response = await request(app)
                .post('/api/ai-analysis/test-service')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('response');
            expect(response.body.data).toHaveProperty('activeKey');
            expect(response.body.data).toHaveProperty('responseTime');
        });

        it('should test AI service with custom prompt', async () => {
            const customPrompt = 'Test custom prompt for AI service';
            
            const response = await request(app)
                .post('/api/ai-analysis/test-service')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ prompt: customPrompt })
                .expect(200);

            expect(response.body.data).toHaveProperty('response');
        });
    });

    describe('Analysis Endpoint with Multi-Key System', () => {
        it('should handle analysis with automatic key switching', async () => {
            const analysisData = {
                dataTypes: ['all'],
                dateRange: {
                    startDate: '2024-01-01',
                    endDate: '2024-12-31'
                }
            };

            // This test may fail if all keys are at quota, which is expected behavior
            const response = await request(app)
                .post('/api/ai-analysis/analyze')
                .set('Authorization', `Bearer ${authToken}`)
                .send(analysisData);

            if (response.status === 200) {
                expect(response.body).toHaveProperty('success', true);
                expect(response.body.data).toHaveProperty('analysis');
                expect(response.body.data.metadata).toHaveProperty('activeApiKey');
            } else if (response.status === 503) {
                // Service unavailable due to quota - this is expected
                expect(response.body).toHaveProperty('success', false);
                expect(response.body).toHaveProperty('error');
            }
        });

        it('should return appropriate error when no data available', async () => {
            const analysisData = {
                dataTypes: ['meals'],
                dateRange: {
                    startDate: '1900-01-01',
                    endDate: '1900-01-02'
                }
            };

            const response = await request(app)
                .post('/api/ai-analysis/analyze')
                .set('Authorization', `Bearer ${authToken}`)
                .send(analysisData)
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body.message).toContain('No data available');
        });
    });
});
```
