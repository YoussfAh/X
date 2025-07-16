# Multi-API Key System for Google AI Integration

## Overview

This enhanced AI system supports multiple Google AI API keys with automatic failover, quota management, and detailed usage tracking. When one API key reaches its quota limit, the system automatically switches to the next available key, ensuring uninterrupted service.

## Features

### 🔄 **Automatic Key Rotation**
- Seamlessly switches between API keys when quotas are exceeded
- Intelligent retry logic with exponential backoff
- Preserves service availability even when some keys fail

### 📊 **Usage Tracking & Statistics**
- Real-time monitoring of API key usage
- Success/failure rates for each key
- Quota status and reset time tracking
- Detailed request logs and statistics

### 🔧 **Robust Error Handling**
- Distinguishes between quota, rate limit, and invalid key errors
- Automatic 24-hour quota reset tracking
- Comprehensive error messages with actionable guidance

### 🛡️ **Backward Compatibility**
- Supports legacy single-key configuration
- Graceful fallback to existing `GOOGLE_AI_API_KEY`
- No breaking changes to existing functionality

## Environment Configuration

### Required Environment Variables

```env
# Primary API key (required)
GOOGLE_AI_API_KEY_1=your_first_google_ai_api_key

# Additional API keys (optional but recommended)
GOOGLE_AI_API_KEY_2=your_second_google_ai_api_key
GOOGLE_AI_API_KEY_3=your_third_google_ai_api_key

# Legacy support (fallback if KEY_1 not set)
GOOGLE_AI_API_KEY=your_legacy_google_ai_api_key
```

### Getting Additional API Keys

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with different Google accounts (or same account)
3. Create new API keys for each account
4. Add them to your environment variables

## How It Works

### Key Selection Logic

1. **Primary Key**: Starts with `GOOGLE_AI_API_KEY_1`
2. **Failover**: When quota exceeded, switches to next available key
3. **Round Robin**: Cycles through all available keys
4. **Smart Tracking**: Remembers quota status and reset times

### Error Handling Flow

```
API Request → Try Current Key → Success ✅
                ↓ (if failed)
            Check Error Type
                ↓
    ┌─ Quota Exceeded → Mark key as exhausted, try next
    ├─ Rate Limited → Wait 2 seconds, try next
    ├─ Invalid Key → Skip key, try next
    └─ Other Error → Log and try next
                ↓
    All Keys Tried → Return detailed error message
```

### Quota Reset Handling

- Automatically tracks 24-hour quota reset periods
- Skips exhausted keys until reset time
- Re-enables keys after quota period expires

## API Endpoints

### Get Service Status
```
GET /api/ai-analysis/service-status
```

**Response:**
```json
{
  "success": true,
  "status": {
    "totalKeys": 3,
    "currentKeyIndex": 2,
    "availableKeys": [
      {
        "keyNumber": 1,
        "isInitialized": true,
        "hasTextModel": true,
        "hasVisionModel": true,
        "keyPreview": "AIzaSyBPus...",
        "requestCount": 150,
        "successCount": 145,
        "errorCount": 5,
        "quotaExceeded": true,
        "quotaResetTime": "2025-07-07T08:00:00.000Z"
      }
    ]
  },
  "usageStats": {
    "totalKeys": 3,
    "currentActiveKey": 2,
    "keyStats": [...]
  }
}
```

### Test All Keys
```
POST /api/ai-analysis/test-keys
```

**Response:**
```json
{
  "success": true,
  "testResults": [
    {
      "keyNumber": 1,
      "status": "Working",
      "textModel": "OK",
      "visionModel": "OK"
    }
  ]
}
```

## Frontend Integration

### Service Status Monitoring

```jsx
import { useGetAIServiceStatusQuery } from '../slices/aiAnalysisApiSlice';

function AIServiceStatus() {
  const { data: serviceStatus, isLoading } = useGetAIServiceStatusQuery();
  
  if (isLoading) return <div>Loading service status...</div>;
  
  return (
    <div>
      <h3>AI Service Status</h3>
      <p>Total Keys: {serviceStatus?.status?.totalKeys}</p>
      <p>Current Key: {serviceStatus?.status?.currentKeyIndex}</p>
      {/* Display key status details */}
    </div>
  );
}
```

### Key Testing

```jsx
import { useTestAllAIKeysMutation } from '../slices/aiAnalysisApiSlice';

function TestAIKeys() {
  const [testKeys, { isLoading, data }] = useTestAllAIKeysMutation();
  
  const handleTest = async () => {
    try {
      const result = await testKeys().unwrap();
      console.log('Test results:', result);
    } catch (error) {
      console.error('Test failed:', error);
    }
  };
  
  return (
    <button onClick={handleTest} disabled={isLoading}>
      {isLoading ? 'Testing...' : 'Test All Keys'}
    </button>
  );
}
```

## Error Messages

### User-Friendly Error Messages

- **All Quota Exceeded**: "All Google AI API keys have reached their daily quota. Service will resume automatically when quotas reset (typically at midnight PST)."
- **Partial Quota**: "Some API keys have exceeded quota, but service continues with remaining keys."
- **Invalid Keys**: "API key configuration error. Please check your Google AI API keys."
- **Temporary Issues**: "AI service temporarily unavailable. Please try again in a moment."

## Monitoring and Maintenance

### Daily Quota Monitoring

- Check service status regularly during high-usage periods
- Monitor success rates and error patterns
- Add additional keys before reaching quota limits

### Key Rotation Best Practices

1. **Distribute Load**: Use keys from different Google accounts
2. **Monitor Usage**: Check daily quota consumption
3. **Plan Capacity**: Add keys before peak usage periods
4. **Test Regularly**: Verify all keys are working

### Troubleshooting

#### Common Issues

1. **"No valid API keys"**
   - Ensure at least one `GOOGLE_AI_API_KEY_*` is set
   - Verify keys are valid in Google AI Studio

2. **"All keys quota exceeded"**
   - Wait for daily reset (midnight PST)
   - Add additional API keys
   - Consider upgrading to paid plans

3. **"Service temporarily unavailable"**
   - Check internet connection
   - Verify Google AI service status
   - Test individual keys manually

#### Debug Mode

Enable detailed logging:
```env
NODE_ENV=development
```

This will show:
- Detailed API key switching logs
- Request/response information
- Error details and retry attempts

## Benefits

### For Users
- **Uninterrupted Service**: Automatic failover prevents service disruptions
- **Better Performance**: Load distribution across multiple keys
- **Transparent Operation**: Users don't see backend key management

### For Developers
- **Easy Configuration**: Simple environment variable setup
- **Comprehensive Monitoring**: Detailed usage statistics and health checks
- **Robust Error Handling**: Clear error messages and automatic recovery

### For Operations
- **Scalable Architecture**: Easy to add more keys as needed
- **Proactive Monitoring**: API endpoints for service health checks
- **Cost Optimization**: Efficient quota utilization across multiple keys

## Migration Guide

### From Single Key to Multi-Key

1. **Keep Existing Configuration**: Current `GOOGLE_AI_API_KEY` will continue working
2. **Add Additional Keys**: Set `GOOGLE_AI_API_KEY_1`, `GOOGLE_AI_API_KEY_2`, etc.
3. **Deploy Changes**: No code changes required, just environment variables
4. **Monitor**: Use new status endpoints to verify multi-key operation

### Zero-Downtime Migration

The system automatically detects available keys and uses them. You can:
1. Add new keys while service is running
2. Restart the service to pick up new keys
3. Gradually migrate from legacy to numbered keys

This enhanced system provides enterprise-grade reliability for AI operations while maintaining simplicity for basic setups.
