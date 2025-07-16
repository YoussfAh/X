# Multi-API Key System Comprehensive Guide - Part 2: Backend Implementation Deep Dive

## Table of Contents
- [Core Service Implementation](#core-service-implementation)
- [Controller Logic & Error Handling](#controller-logic--error-handling)
- [API Routes & Middleware](#api-routes--middleware)
- [Database Integration](#database-integration)
- [Advanced Error Recovery](#advanced-error-recovery)
- [Performance Optimization](#performance-optimization)

---

## 🔧 Core Service Implementation

### aiService.js - Complete Implementation

The `aiService.js` file is the heart of the multi-API key system. Here's the complete implementation with detailed explanations:

```javascript
// backend/utils/aiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  constructor() {
    this.apiKeys = this.loadApiKeys();
    this.currentKeyIndex = 0;
    this.keyStatuses = new Array(this.apiKeys.length).fill('available');
    this.keyFailureTimes = new Array(this.apiKeys.length).fill(0);
    this.usageStats = {
      totalRequests: 0,
      successfulRequests: 0,
      keyUsage: new Array(this.apiKeys.length).fill(0),
      lastSwitchTime: null,
      switchCount: 0
    };
    
    console.log(`🤖 AI Service initialized with ${this.apiKeys.length} API keys`);
  }

  loadApiKeys() {
    const keys = [
      process.env.GOOGLE_AI_API_KEY_1,
      process.env.GOOGLE_AI_API_KEY_2,
      process.env.GOOGLE_AI_API_KEY_3
    ].filter(Boolean);

    if (keys.length === 0) {
      throw new Error('❌ No Google AI API keys found in environment variables');
    }

    console.log(`✅ Loaded ${keys.length} API keys from environment`);
    return keys;
  }

  getActiveKey() {
    return this.apiKeys[this.currentKeyIndex];
  }

  async analyzeData(data, userId) {
    this.usageStats.totalRequests++;
    const startTime = Date.now();
    
    console.log(`🧠 Starting AI analysis for user ${userId} (Key Index: ${this.currentKeyIndex})`);

    for (let attempt = 0; attempt < this.apiKeys.length; attempt++) {
      try {
        const result = await this.makeAnalysisRequest(data);
        
        this.usageStats.successfulRequests++;
        this.usageStats.keyUsage[this.currentKeyIndex]++;
        
        const duration = (Date.now() - startTime) / 1000;
        console.log(`✅ AI analysis completed successfully (Key: ${this.currentKeyIndex}, Duration: ${duration}s)`);
        
        return result;
      } catch (error) {
        console.log(`❌ Analysis failed with key ${this.currentKeyIndex}: ${error.message}`);
        
        const errorType = this.analyzeError(error);
        this.handleKeyError(this.currentKeyIndex, errorType);
        
        if (!this.switchToNextKey()) {
          console.log('🚫 All API keys exhausted');
          throw new Error('All API keys are currently unavailable. Please try again later.');
        }
        
        console.log(`🔄 Switched to key ${this.currentKeyIndex}, retrying...`);
      }
    }

    throw new Error('Failed to complete analysis after trying all available keys');
  }

  async makeAnalysisRequest(data) {
    const genAI = new GoogleGenerativeAI(this.getActiveKey());
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = this.buildAnalysisPrompt(data);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.warn('⚠️ Failed to parse AI response as JSON, returning as text');
      return { analysis: text, rawResponse: true };
    }
  }

  buildAnalysisPrompt(data) {
    return `
Analyze the following fitness data and provide insights in JSON format:

Data: ${JSON.stringify(data)}

Please provide analysis in this JSON structure:
{
  "summary": "Brief overview of the data",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "trends": {
    "positive": ["positive trend 1"],
    "areas_for_improvement": ["improvement area 1"]
  },
  "score": 85
}

Focus on actionable insights and specific recommendations based on the provided data.
    `.trim();
  }

  analyzeError(error) {
    const errorMessage = error.message?.toLowerCase() || '';
    
    if (errorMessage.includes('quota') || errorMessage.includes('limit exceeded')) {
      return 'QUOTA_EXCEEDED';
    }
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return 'RATE_LIMITED';
    }
    if (errorMessage.includes('invalid') && errorMessage.includes('key')) {
      return 'INVALID_KEY';
    }
    if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
      return 'AUTH_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }

  handleKeyError(keyIndex, errorType) {
    this.keyFailureTimes[keyIndex] = Date.now();
    
    switch (errorType) {
      case 'QUOTA_EXCEEDED':
        this.keyStatuses[keyIndex] = 'quota_exceeded';
        console.log(`📊 API Key ${keyIndex} quota exceeded`);
        break;
      case 'RATE_LIMITED':
        this.keyStatuses[keyIndex] = 'rate_limited';
        console.log(`⏱️ API Key ${keyIndex} rate limited`);
        break;
      case 'INVALID_KEY':
        this.keyStatuses[keyIndex] = 'invalid';
        console.log(`🔑 API Key ${keyIndex} is invalid`);
        break;
      default:
        this.keyStatuses[keyIndex] = 'error';
        console.log(`❌ API Key ${keyIndex} encountered an error: ${errorType}`);
    }
  }

  switchToNextKey() {
    const initialIndex = this.currentKeyIndex;
    
    for (let i = 0; i < this.apiKeys.length; i++) {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      
      if (this.keyStatuses[this.currentKeyIndex] === 'available' || 
          this.keyStatuses[this.currentKeyIndex] === 'error') {
        
        this.usageStats.lastSwitchTime = new Date().toISOString();
        this.usageStats.switchCount++;
        
        console.log(`🔄 Switched from key ${initialIndex} to key ${this.currentKeyIndex}`);
        return true;
      }
    }
    
    return false; // No available keys found
  }

  async testApiKey(keyIndex) {
    if (keyIndex >= this.apiKeys.length) {
      throw new Error('Invalid key index');
    }

    const testKey = this.apiKeys[keyIndex];
    const genAI = new GoogleGenerativeAI(testKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    try {
      const result = await model.generateContent('Test: Respond with "OK" if this API key is working.');
      const response = await result.response;
      const text = response.text();
      
      this.keyStatuses[keyIndex] = 'available';
      console.log(`✅ API Key ${keyIndex} test successful`);
      
      return {
        success: true,
        keyIndex,
        response: text.trim(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const errorType = this.analyzeError(error);
      this.handleKeyError(keyIndex, errorType);
      
      console.log(`❌ API Key ${keyIndex} test failed: ${error.message}`);
      
      return {
        success: false,
        keyIndex,
        error: error.message,
        errorType,
        timestamp: new Date().toISOString()
      };
    }
  }

  async testAllKeys() {
    console.log('🧪 Testing all API keys...');
    const results = [];
    
    for (let i = 0; i < this.apiKeys.length; i++) {
      const result = await this.testApiKey(i);
      results.push(result);
      
      // Small delay between tests to avoid rate limiting
      if (i < this.apiKeys.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const workingKeys = results.filter(r => r.success).length;
    console.log(`✅ Key testing complete: ${workingKeys}/${this.apiKeys.length} keys working`);
    
    return results;
  }

  getServiceStatus() {
    const availableKeys = this.keyStatuses.filter(status => 
      status === 'available' || status === 'error'
    ).length;

    return {
      isConfigured: this.apiKeys.length > 0,
      totalKeys: this.apiKeys.length,
      availableKeys,
      activeKeyIndex: this.currentKeyIndex,
      lastSwitchTime: this.usageStats.lastSwitchTime,
      keysStatus: this.keyStatuses.map((status, index) => ({
        index,
        status,
        lastFailureTime: this.keyFailureTimes[index] || null,
        usageCount: this.usageStats.keyUsage[index] || 0
      })),
      usageStats: {
        totalRequests: this.usageStats.totalRequests,
        successfulRequests: this.usageStats.successfulRequests,
        successRate: this.usageStats.totalRequests > 0 
          ? (this.usageStats.successfulRequests / this.usageStats.totalRequests * 100).toFixed(2)
          : '0.00',
        switchCount: this.usageStats.switchCount
      }
    };
  }

  // Recovery mechanism for failed keys
  async attemptKeyRecovery() {
    console.log('🔄 Attempting to recover failed API keys...');
    let recoveredCount = 0;

    for (let i = 0; i < this.apiKeys.length; i++) {
      if (this.keyStatuses[i] !== 'available' && this.keyStatuses[i] !== 'invalid') {
        const timeSinceFailure = Date.now() - this.keyFailureTimes[i];
        
        // Attempt recovery after 1 hour for quota/rate limit issues
        if (timeSinceFailure > 3600000) {
          try {
            const testResult = await this.testApiKey(i);
            if (testResult.success) {
              recoveredCount++;
              console.log(`✅ API Key ${i} recovered successfully`);
            }
          } catch (error) {
            console.log(`❌ API Key ${i} recovery failed`);
          }
        }
      }
    }

    console.log(`🎯 Recovery complete: ${recoveredCount} keys recovered`);
    return recoveredCount;
  }
}

// Export singleton instance
const aiService = new AIService();

// Start recovery process every hour
setInterval(() => {
  aiService.attemptKeyRecovery();
}, 3600000); // 1 hour

module.exports = aiService;
```

---

## 🎮 Controller Logic & Error Handling

### aiAnalysisController.js - Complete Implementation

```javascript
// backend/controllers/aiAnalysisController.js
const aiService = require('../utils/aiService');
const AIAnalysis = require('../models/aiAnalysisModel');

class AIAnalysisController {
  
  async analyzeData(req, res) {
    const startTime = Date.now();
    
    try {
      const { data } = req.body;
      const userId = req.user?.id || 'anonymous';

      // Validate input data
      if (!data) {
        return res.status(400).json({
          success: false,
          message: 'No data provided for analysis'
        });
      }

      console.log(`📊 AI Analysis request from user ${userId}`);

      // Perform AI analysis using multi-key service
      const analysisResult = await aiService.analyzeData(data, userId);

      // Save analysis to database
      const analysis = new AIAnalysis({
        userId,
        inputData: data,
        result: analysisResult,
        timestamp: new Date(),
        processingTime: Date.now() - startTime,
        apiKeyUsed: aiService.currentKeyIndex
      });

      await analysis.save();

      res.json({
        success: true,
        data: analysisResult,
        metadata: {
          processingTime: Date.now() - startTime,
          apiKeyIndex: aiService.currentKeyIndex,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ AI Analysis error:', error.message);
      
      // Determine error type and provide appropriate response
      const errorResponse = this.buildErrorResponse(error);
      
      res.status(errorResponse.status).json({
        success: false,
        message: errorResponse.message,
        errorType: errorResponse.type,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      });
    }
  }

  buildErrorResponse(error) {
    const message = error.message.toLowerCase();

    if (message.includes('all api keys')) {
      return {
        status: 503,
        type: 'SERVICE_UNAVAILABLE',
        message: 'AI analysis service is temporarily unavailable. Our team has been notified and is working to resolve this issue. Please try again in a few minutes.'
      };
    }

    if (message.includes('quota') || message.includes('limit')) {
      return {
        status: 429,
        type: 'QUOTA_EXCEEDED',
        message: 'AI analysis service is experiencing high demand. Please try again in a few moments.'
      };
    }

    if (message.includes('authentication') || message.includes('unauthorized')) {
      return {
        status: 401,
        type: 'AUTH_ERROR',
        message: 'Authentication required. Please log in and try again.'
      };
    }

    if (message.includes('invalid') && message.includes('data')) {
      return {
        status: 400,
        type: 'INVALID_DATA',
        message: 'The provided data is invalid or incomplete. Please check your input and try again.'
      };
    }

    // Generic error for unknown issues
    return {
      status: 500,
      type: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred during analysis. Please try again later.'
    };
  }

  async getServiceStatus(req, res) {
    try {
      const status = aiService.getServiceStatus();
      
      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Service status error:', error.message);
      
      res.status(500).json({
        success: false,
        message: 'Unable to retrieve service status',
        timestamp: new Date().toISOString()
      });
    }
  }

  async testApiKey(req, res) {
    try {
      const { keyIndex } = req.params;
      const index = parseInt(keyIndex);

      if (isNaN(index) || index < 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid key index provided'
        });
      }

      const testResult = await aiService.testApiKey(index);
      
      res.json({
        success: testResult.success,
        data: testResult,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ API key test error:', error.message);
      
      res.status(500).json({
        success: false,
        message: 'Failed to test API key',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async testAllKeys(req, res) {
    try {
      console.log('🧪 Testing all API keys via endpoint...');
      
      const results = await aiService.testAllKeys();
      
      const summary = {
        totalKeys: results.length,
        workingKeys: results.filter(r => r.success).length,
        failedKeys: results.filter(r => !r.success).length,
        results: results
      };

      res.json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ All keys test error:', error.message);
      
      res.status(500).json({
        success: false,
        message: 'Failed to test API keys',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async getLiveServiceTest(req, res) {
    try {
      const testData = {
        message: "This is a test analysis request",
        timestamp: new Date().toISOString()
      };

      const startTime = Date.now();
      const result = await aiService.analyzeData(testData, 'system_test');
      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          testResult: result,
          responseTime,
          activeKeyIndex: aiService.currentKeyIndex,
          serviceStatus: aiService.getServiceStatus()
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Live service test error:', error.message);
      
      res.status(500).json({
        success: false,
        message: 'Live service test failed',
        error: error.message,
        serviceStatus: aiService.getServiceStatus(),
        timestamp: new Date().toISOString()
      });
    }
  }

  async getAnalysisHistory(req, res) {
    try {
      const userId = req.user?.id;
      const { limit = 10, offset = 0 } = req.query;

      const query = userId ? { userId } : {};
      
      const analyses = await AIAnalysis.find(query)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .select('-inputData'); // Exclude potentially large input data

      const total = await AIAnalysis.countDocuments(query);

      res.json({
        success: true,
        data: {
          analyses,
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: (parseInt(offset) + parseInt(limit)) < total
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Analysis history error:', error.message);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve analysis history',
        timestamp: new Date().toISOString()
      });
    }
  }

  async forceKeySwitch(req, res) {
    try {
      const { targetKeyIndex } = req.body;

      if (typeof targetKeyIndex === 'number' && targetKeyIndex >= 0) {
        const oldIndex = aiService.currentKeyIndex;
        aiService.currentKeyIndex = targetKeyIndex;
        
        console.log(`🔄 Manual key switch: ${oldIndex} → ${targetKeyIndex}`);
        
        res.json({
          success: true,
          message: `Switched from key ${oldIndex} to key ${targetKeyIndex}`,
          data: {
            previousKeyIndex: oldIndex,
            newKeyIndex: targetKeyIndex,
            serviceStatus: aiService.getServiceStatus()
          },
          timestamp: new Date().toISOString()
        });
      } else {
        // Auto-switch to next available key
        const success = aiService.switchToNextKey();
        
        if (success) {
          res.json({
            success: true,
            message: `Switched to key ${aiService.currentKeyIndex}`,
            data: {
              newKeyIndex: aiService.currentKeyIndex,
              serviceStatus: aiService.getServiceStatus()
            },
            timestamp: new Date().toISOString()
          });
        } else {
          res.status(503).json({
            success: false,
            message: 'No available keys to switch to',
            timestamp: new Date().toISOString()
          });
        }
      }

    } catch (error) {
      console.error('❌ Force key switch error:', error.message);
      
      res.status(500).json({
        success: false,
        message: 'Failed to switch API key',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new AIAnalysisController();
```

---

## 🛣️ API Routes & Middleware

### aiAnalysisRoutes.js - Complete Implementation

```javascript
// backend/routes/aiAnalysisRoutes.js
const express = require('express');
const router = express.Router();
const aiAnalysisController = require('../controllers/aiAnalysisController');

// Middleware for request logging
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  console.log(`📝 [${timestamp}] ${method} ${url} - ${userAgent}`);
  
  // Log response time
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    console.log(`📊 [${timestamp}] ${method} ${url} - ${status} (${duration}ms)`);
  });
  
  next();
};

// Rate limiting middleware for AI analysis
const rateLimiter = (req, res, next) => {
  // Basic rate limiting - can be enhanced with Redis in production
  const userId = req.user?.id || req.ip;
  const key = `rate_limit_${userId}`;
  
  // For now, just log the request - implement proper rate limiting in production
  console.log(`🚦 Rate limit check for ${userId}`);
  next();
};

// Validation middleware for analysis requests
const validateAnalysisRequest = (req, res, next) => {
  const { data } = req.body;
  
  if (!data) {
    return res.status(400).json({
      success: false,
      message: 'Analysis data is required',
      timestamp: new Date().toISOString()
    });
  }
  
  if (typeof data !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'Analysis data must be a valid object',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Apply request logging to all routes
router.use(requestLogger);

// Main AI analysis endpoint
router.post('/analyze', 
  rateLimiter,
  validateAnalysisRequest,
  aiAnalysisController.analyzeData
);

// Service status and monitoring endpoints
router.get('/status', aiAnalysisController.getServiceStatus);

router.get('/test-keys', aiAnalysisController.testAllKeys);

router.get('/test-key/:keyIndex', aiAnalysisController.testApiKey);

router.get('/live-test', aiAnalysisController.getLiveServiceTest);

// Analysis history and management
router.get('/history', aiAnalysisController.getAnalysisHistory);

// Admin endpoints for key management
router.post('/switch-key', aiAnalysisController.forceKeySwitch);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI Analysis service is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('❌ Route error:', error.message);
  
  res.status(500).json({
    success: false,
    message: 'An error occurred processing your request',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
```

---

## 💾 Database Integration

### aiAnalysisModel.js - MongoDB Schema

```javascript
// backend/models/aiAnalysisModel.js
const mongoose = require('mongoose');

const aiAnalysisSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  inputData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  result: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  processingTime: {
    type: Number, // milliseconds
    required: true
  },
  
  apiKeyUsed: {
    type: Number, // index of the API key that was used
    required: true
  },
  
  success: {
    type: Boolean,
    default: true
  },
  
  errorMessage: {
    type: String,
    default: null
  },
  
  metadata: {
    userAgent: String,
    ipAddress: String,
    requestId: String
  }
}, {
  timestamps: true,
  collection: 'ai_analyses'
});

// Indexes for performance
aiAnalysisSchema.index({ userId: 1, timestamp: -1 });
aiAnalysisSchema.index({ apiKeyUsed: 1, timestamp: -1 });
aiAnalysisSchema.index({ success: 1, timestamp: -1 });

// Static methods for analytics
aiAnalysisSchema.statics.getUsageStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        timestamp: {
          $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          $lte: endDate || new Date()
        }
      }
    },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        successfulRequests: { $sum: { $cond: ['$success', 1, 0] } },
        avgProcessingTime: { $avg: '$processingTime' },
        keyUsage: {
          $push: '$apiKeyUsed'
        }
      }
    }
  ]);
};

aiAnalysisSchema.statics.getKeyUsageDistribution = function(days = 7) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        success: true
      }
    },
    {
      $group: {
        _id: '$apiKeyUsed',
        count: { $sum: 1 },
        avgProcessingTime: { $avg: '$processingTime' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

module.exports = mongoose.model('AIAnalysis', aiAnalysisSchema);
```

---

## 🔄 Advanced Error Recovery

### Automated Recovery System

```javascript
// backend/utils/recoveryService.js
const aiService = require('./aiService');
const AIAnalysis = require('../models/aiAnalysisModel');

class RecoveryService {
  constructor() {
    this.isRecoveryRunning = false;
    this.recoveryInterval = 3600000; // 1 hour
    this.maxRecoveryAttempts = 3;
    this.startRecoveryScheduler();
  }

  startRecoveryScheduler() {
    setInterval(async () => {
      if (!this.isRecoveryRunning) {
        await this.performRecovery();
      }
    }, this.recoveryInterval);
    
    console.log('🔄 Recovery scheduler started');
  }

  async performRecovery() {
    this.isRecoveryRunning = true;
    
    try {
      console.log('🔄 Starting automated recovery process...');
      
      // 1. Attempt to recover failed API keys
      const recoveredKeys = await aiService.attemptKeyRecovery();
      
      // 2. Test all keys to verify their status
      const testResults = await aiService.testAllKeys();
      const workingKeys = testResults.filter(r => r.success).length;
      
      // 3. Log recovery results
      await this.logRecoveryAttempt(recoveredKeys, workingKeys, testResults);
      
      // 4. Send alerts if needed
      if (workingKeys === 0) {
        await this.sendCriticalAlert('All API keys are non-functional');
      } else if (workingKeys === 1) {
        await this.sendWarningAlert('Only one API key is functional');
      }
      
      console.log(`✅ Recovery complete: ${recoveredKeys} keys recovered, ${workingKeys} total working`);
      
    } catch (error) {
      console.error('❌ Recovery process failed:', error.message);
      await this.sendCriticalAlert(`Recovery process failed: ${error.message}`);
    } finally {
      this.isRecoveryRunning = false;
    }
  }

  async logRecoveryAttempt(recoveredKeys, workingKeys, testResults) {
    const logEntry = {
      timestamp: new Date(),
      recoveredKeys,
      workingKeys,
      totalKeys: testResults.length,
      keyDetails: testResults,
      type: 'recovery_attempt'
    };
    
    // In production, save to a dedicated recovery log collection
    console.log('📝 Recovery log:', JSON.stringify(logEntry, null, 2));
  }

  async sendCriticalAlert(message) {
    // In production, integrate with alerting systems (email, Slack, PagerDuty, etc.)
    console.log(`🚨 CRITICAL ALERT: ${message}`);
    
    // Example: Send email notification
    // await emailService.sendAlert({
    //   subject: 'Critical: AI Service Failure',
    //   message: message,
    //   priority: 'high'
    // });
  }

  async sendWarningAlert(message) {
    console.log(`⚠️ WARNING ALERT: ${message}`);
    
    // Example: Send Slack notification
    // await slackService.sendWarning({
    //   channel: '#alerts',
    //   message: message
    // });
  }

  async getRecoveryStats(days = 7) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // In production, query recovery logs from database
    return {
      totalRecoveryAttempts: 0,
      successfulRecoveries: 0,
      averageRecoveryTime: 0,
      lastRecoveryTime: null
    };
  }
}

module.exports = new RecoveryService();
```

---

## ⚡ Performance Optimization

### Request Caching and Optimization

```javascript
// backend/utils/cacheService.js
const NodeCache = require('node-cache');

class CacheService {
  constructor() {
    // Cache AI responses for identical requests
    this.responseCache = new NodeCache({ 
      stdTTL: 3600, // 1 hour
      checkperiod: 600 // Check for expired keys every 10 minutes
    });
    
    // Cache service status for faster responses
    this.statusCache = new NodeCache({ 
      stdTTL: 30, // 30 seconds
      checkperiod: 60
    });
    
    console.log('💾 Cache service initialized');
  }

  generateCacheKey(data, userId) {
    // Create a hash of the input data for caching
    const crypto = require('crypto');
    const dataStr = JSON.stringify(data) + userId;
    return crypto.createHash('md5').update(dataStr).digest('hex');
  }

  async getCachedResponse(data, userId) {
    const cacheKey = this.generateCacheKey(data, userId);
    const cached = this.responseCache.get(cacheKey);
    
    if (cached) {
      console.log(`💾 Cache hit for key: ${cacheKey.substring(0, 8)}...`);
      return {
        ...cached,
        fromCache: true,
        cacheHit: true
      };
    }
    
    return null;
  }

  setCachedResponse(data, userId, response) {
    const cacheKey = this.generateCacheKey(data, userId);
    this.responseCache.set(cacheKey, {
      ...response,
      cachedAt: new Date().toISOString()
    });
    
    console.log(`💾 Response cached with key: ${cacheKey.substring(0, 8)}...`);
  }

  getCachedStatus() {
    return this.statusCache.get('service_status');
  }

  setCachedStatus(status) {
    this.statusCache.set('service_status', status);
  }

  clearCache() {
    this.responseCache.flushAll();
    this.statusCache.flushAll();
    console.log('💾 Cache cleared');
  }

  getCacheStats() {
    return {
      responseCache: {
        keys: this.responseCache.keys().length,
        hits: this.responseCache.getStats().hits,
        misses: this.responseCache.getStats().misses
      },
      statusCache: {
        keys: this.statusCache.keys().length,
        hits: this.statusCache.getStats().hits,
        misses: this.statusCache.getStats().misses
      }
    };
  }
}

module.exports = new CacheService();
```

### Optimized aiService with Caching

```javascript
// Enhanced analyzeData method with caching
async analyzeData(data, userId) {
  // Check cache first
  const cachedResponse = await cacheService.getCachedResponse(data, userId);
  if (cachedResponse) {
    return cachedResponse;
  }

  this.usageStats.totalRequests++;
  const startTime = Date.now();
  
  console.log(`🧠 Starting AI analysis for user ${userId} (Key Index: ${this.currentKeyIndex})`);

  for (let attempt = 0; attempt < this.apiKeys.length; attempt++) {
    try {
      const result = await this.makeAnalysisRequest(data);
      
      this.usageStats.successfulRequests++;
      this.usageStats.keyUsage[this.currentKeyIndex]++;
      
      const duration = (Date.now() - startTime) / 1000;
      console.log(`✅ AI analysis completed successfully (Key: ${this.currentKeyIndex}, Duration: ${duration}s)`);
      
      // Cache the successful response
      cacheService.setCachedResponse(data, userId, result);
      
      return result;
    } catch (error) {
      // ... existing error handling code ...
    }
  }

  throw new Error('Failed to complete analysis after trying all available keys');
}
```

---

Continue to Part 3 for Frontend Integration & UI Components implementation details...

*This document covers the complete backend implementation of the multi-API key system. Refer to the other parts of this guide for frontend integration, testing strategies, and production deployment.*
