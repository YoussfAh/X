import { GoogleGenerativeAI } from '@google/generative-ai';

class AIService {
  constructor() {
    // Initialize all available API keys
    this.apiKeys = [
      process.env.GOOGLE_AI_API_KEY_1,
      process.env.GOOGLE_AI_API_KEY_2,
      process.env.GOOGLE_AI_API_KEY_3
    ].filter(key => key && key.trim() !== ''); // Filter out empty keys

    if (this.apiKeys.length === 0) {
      console.error('❌ No Google AI API keys found! Please set at least GOOGLE_AI_API_KEY_1 in your .env file');
      throw new Error('No Google AI API keys configured');
    }

    this.currentKeyIndex = 0;
    this.models = {};
    this.visionModels = {};
    this.keyUsageStats = {};
    
    // Initialize usage tracking
    this.apiKeys.forEach((_, index) => {
      this.keyUsageStats[index] = {
        requestCount: 0,
        successCount: 0,
        errorCount: 0,
        lastUsed: null,
        quotaExceeded: false,
        quotaResetTime: null
      };
    });
    
    // Initialize models for each key
    this.initializeModels();
    
    console.log(`🔧 AI Service initialized with ${this.apiKeys.length} API key(s)`);
  }

  initializeModels() {
    this.apiKeys.forEach((key, index) => {
      try {
        const genAI = new GoogleGenerativeAI(key);
        this.models[index] = {
          text: genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }),
          vision: genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
        };
        console.log(`✅ Initialized AI models (text & vision) with key ${index + 1}`);
      } catch (error) {
        console.error(`❌ Failed to initialize AI models with key ${index + 1}:`, error.message);
      }
    });
  }

  async generateContent(prompt, maxRetries = null, useVision = false) {
    const retryCount = maxRetries || this.apiKeys.length;
    let lastError = null;
    let quotaErrors = [];
    let invalidKeyErrors = [];
    let overloadedErrors = [];

    for (let attempt = 0; attempt < retryCount; attempt++) {
      const keyIndex = (this.currentKeyIndex + attempt) % this.apiKeys.length;
      const modelSet = this.models[keyIndex];

      if (!modelSet) {
        console.log(`⚠️ No model available for key ${keyIndex + 1}, skipping...`);
        continue;
      }

      // Choose the appropriate model (text or vision)
      const model = useVision ? modelSet.vision : modelSet.text;
      if (!model) {
        console.log(`⚠️ No ${useVision ? 'vision' : 'text'} model available for key ${keyIndex + 1}, skipping...`);
        continue;
      }

      // Skip if we know this key has quota exceeded (unless it's been more than 24 hours)
      if (this.keyUsageStats[keyIndex].quotaExceeded) {
        const resetTime = this.keyUsageStats[keyIndex].quotaResetTime;
        if (resetTime && Date.now() < resetTime) {
          console.log(`⏸️ Key ${keyIndex + 1} quota still exceeded, skipping until reset...`);
          continue;
        } else {
          // Reset quota flag after 24 hours
          this.keyUsageStats[keyIndex].quotaExceeded = false;
          this.keyUsageStats[keyIndex].quotaResetTime = null;
        }
      }

      try {
        console.log(`🔄 Attempting AI analysis with API key ${keyIndex + 1} (${useVision ? 'vision' : 'text'} model)... (Attempt ${attempt + 1}/${retryCount})`);
        console.log(`🔑 Using API key #${keyIndex + 1}: ${this.apiKeys[keyIndex].substring(0, 20)}...`);
        
        // Update usage stats
        this.keyUsageStats[keyIndex].requestCount++;
        this.keyUsageStats[keyIndex].lastUsed = new Date();
        
        // Handle different prompt types
        let result;
        if (Array.isArray(prompt)) {
          // For vision model with image parts
          result = await model.generateContent(prompt);
        } else {
          // For text-only prompts
          result = await model.generateContent(prompt);
        }
        
        const response = result.response;
        const text = response.text();

        // If successful, update current key index and stats
        this.currentKeyIndex = keyIndex;
        this.keyUsageStats[keyIndex].successCount++;
        
        // Log success and key switching info
        if (attempt > 0) {
          console.log(`✅ Successfully switched to API key ${keyIndex + 1} after ${attempt} failed attempts`);
        } else {
          console.log(`✅ AI analysis successful with key ${keyIndex + 1} (${useVision ? 'vision' : 'text'} model)`);
        }
        
        // Show usage stats for this key
        const stats = this.keyUsageStats[keyIndex];
        console.log(`📊 Key ${keyIndex + 1} stats: ${stats.successCount}/${stats.requestCount} successful requests`);
        
        return text;

      } catch (error) {
        lastError = error;
        this.keyUsageStats[keyIndex].errorCount++;
        
        console.error(`❌ API key ${keyIndex + 1} failed:`, error.message);

        // Check if it's a quota exceeded error - improved detection
        if (error.message.includes('quota') || 
            error.message.includes('QUOTA_EXCEEDED') || 
            error.message.includes('Resource has been exhausted') ||
            error.message.includes('Quota exceeded') ||
            error.message.includes('quota_exceeded') ||
            error.status === 429 ||
            error.code === 'QUOTA_EXCEEDED') {
          quotaErrors.push(keyIndex + 1);
          this.keyUsageStats[keyIndex].quotaExceeded = true;
          this.keyUsageStats[keyIndex].quotaResetTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
          console.log(`🚫 Key ${keyIndex + 1} quota exceeded - will retry after 24 hours. Trying next key...`);
          console.log(`🔄 Switching to next available API key...`);
          continue;
        }

        // Check for model overloaded error (503 Service Unavailable)
        if (error.message.includes('overloaded') || 
            error.message.includes('Service Unavailable') ||
            error.message.includes('503') ||
            error.status === 503) {
          overloadedErrors.push(keyIndex + 1);
          console.log(`🔄 Key ${keyIndex + 1} model is overloaded. Waiting before trying next key...`);
          
          // Wait with exponential backoff before trying next key
          const backoffDelay = Math.min(2000 * Math.pow(2, attempt), 30000); // Max 30 seconds
          console.log(`⏱️ Waiting ${backoffDelay}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          continue;
        }

        // Check for invalid API key
        if (error.message.includes('API_KEY_INVALID') || 
            error.message.includes('Invalid API key') ||
            error.message.includes('API key not valid')) {
          invalidKeyErrors.push(keyIndex + 1);
          console.log(`🔑 Key ${keyIndex + 1} is invalid - please check configuration. Trying next key...`);
          continue;
        }

        // For rate limiting, wait briefly before trying next key
        if (error.message.includes('RATE_LIMIT') || error.message.includes('Too Many Requests')) {
          console.log(`⏱️ Rate limit hit for key ${keyIndex + 1}, waiting 2 seconds before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

        // For other errors, continue to next key
        console.log(`⚠️ Unexpected error with key ${keyIndex + 1}: ${error.message}. Trying next key...`);
      }
    }

    // All keys failed - provide detailed error messages
    if (quotaErrors.length === this.apiKeys.length && quotaErrors.length > 0) {
      const message = `🚫 ALL API QUOTA EXCEEDED: All ${this.apiKeys.length} Google AI API key(s) have reached their daily quota limit. The service will automatically resume when quotas reset (typically at midnight PST). Consider adding more API keys for higher daily limits.`;
      console.log(message);
      throw new Error(message);
    } else if (overloadedErrors.length === this.apiKeys.length && overloadedErrors.length > 0) {
      const message = `⏸️ AI MODELS OVERLOADED: All Google AI models are currently overloaded with high traffic. This is a temporary Google service issue. Please try again in 1-2 minutes. Alternative: Consider upgrading to paid API tier for better availability.`;
      console.log(message);
      throw new Error(message);
    } else if (invalidKeyErrors.length === this.apiKeys.length && invalidKeyErrors.length > 0) {
      const message = `🔑 ALL API KEYS INVALID: All configured API keys are invalid. Please check your Google AI API key configuration.`;
      console.log(message);
      throw new Error(message);
    } else if (quotaErrors.length > 0) {
      const workingKeys = this.apiKeys.length - quotaErrors.length;
      const message = `⚠️ PARTIAL QUOTA EXCEEDED: ${quotaErrors.length} of ${this.apiKeys.length} API keys have exceeded quota. ${workingKeys} key(s) still available. Last error: ${lastError?.message || 'Unknown error'}`;
      console.log(message);
      throw new Error(message);
    } else if (overloadedErrors.length > 0) {
      const workingKeys = this.apiKeys.length - overloadedErrors.length;
      const message = `⚠️ MODELS PARTIALLY OVERLOADED: ${overloadedErrors.length} of ${this.apiKeys.length} models are overloaded. Try again in 1-2 minutes. Last error: ${lastError?.message || 'Unknown error'}`;
      console.log(message);
      throw new Error(message);
    } else if (lastError) {
      const message = `❌ AI SERVICE TEMPORARILY UNAVAILABLE: All API attempts failed. Please try again in a moment. Last error: ${lastError.message}. Service status: ${this.apiKeys.length} keys available, currently using key ${this.currentKeyIndex + 1}.`;
      console.log(message);
      throw new Error(message);
    } else {
      const message = `🔧 NO VALID API KEYS: No valid Google AI API keys available. Please configure at least one valid API key (GOOGLE_AI_API_KEY_1, GOOGLE_AI_API_KEY_2, or GOOGLE_AI_API_KEY_3).`;
      console.log(message);
      throw new Error(message);
    }
  }

  getStatus() {
    return {
      totalKeys: this.apiKeys.length,
      currentKeyIndex: this.currentKeyIndex + 1,
      availableKeys: this.apiKeys.map((key, index) => ({
        keyNumber: index + 1,
        isInitialized: !!this.models[index],
        hasTextModel: !!(this.models[index] && this.models[index].text),
        hasVisionModel: !!(this.models[index] && this.models[index].vision),
        keyPreview: key ? `${key.substring(0, 10)}...` : 'Not set',
        ...this.keyUsageStats[index]
      }))
    };
  }

  // Method to test all keys
  async testAllKeys() {
    const results = [];
    
    for (let i = 0; i < this.apiKeys.length; i++) {
      const modelSet = this.models[i];
      if (!modelSet) {
        results.push({
          keyNumber: i + 1,
          status: 'Not initialized',
          error: 'Model not available'
        });
        continue;
      }

      try {
        const testPrompt = "Test connection. Respond with 'OK' only.";
        
        // Test text model
        let textResult = null;
        if (modelSet.text) {
          try {
            const result = await modelSet.text.generateContent(testPrompt);
            textResult = result.response.text().trim();
          } catch (error) {
            textResult = `Text model error: ${error.message}`;
          }
        }
        
        // Test vision model
        let visionResult = null;
        if (modelSet.vision) {
          try {
            const result = await modelSet.vision.generateContent(testPrompt);
            visionResult = result.response.text().trim();
          } catch (error) {
            visionResult = `Vision model error: ${error.message}`;
          }
        }
        
        results.push({
          keyNumber: i + 1,
          status: 'Working',
          textModel: textResult,
          visionModel: visionResult
        });
      } catch (error) {
        results.push({
          keyNumber: i + 1,
          status: 'Failed',
          error: error.message
        });
      }
    }

    return results;
  }

  // Method to reset quota flags manually (for testing)
  resetQuotaFlags() {
    this.apiKeys.forEach((_, index) => {
      this.keyUsageStats[index].quotaExceeded = false;
      this.keyUsageStats[index].quotaResetTime = null;
    });
    console.log('🔄 All quota flags reset manually');
  }

  // Method to get detailed usage statistics
  getUsageStats() {
    return {
      totalKeys: this.apiKeys.length,
      currentActiveKey: this.currentKeyIndex + 1,
      keyStats: this.apiKeys.map((key, index) => ({
        keyNumber: index + 1,
        keyPreview: key ? `${key.substring(0, 10)}...` : 'Not set',
        ...this.keyUsageStats[index],
        successRate: this.keyUsageStats[index].requestCount > 0 
          ? Math.round((this.keyUsageStats[index].successCount / this.keyUsageStats[index].requestCount) * 100) 
          : 0
      }))
    };
  }
}

// Create singleton instance
const aiService = new AIService();

export default aiService;
