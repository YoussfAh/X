# Google AI API Limits & Usage Guide

## 📊 **Current API Limits (Free Tier):**

### **Gemini 1.5 Flash (Free Tier):**
- **Requests per minute (RPM):** 15
- **Requests per day (RPD):** 1,500
- **Tokens per minute (TPM):** 1,000,000
- **Input tokens per request:** Up to 1,048,576
- **Output tokens per request:** Up to 8,192

### **Your Setup:**
- **3 API Keys** = 3x limits
- **Total daily requests:** 4,500 (1,500 × 3)
- **Total per minute:** 45 requests (15 × 3)

## 🎯 **How Much Analysis You Can Do:**

### **Per Day (Maximum):**
- **Individual analyses:** ~4,500 per day
- **Realistic usage:** ~3,000-4,000 (accounting for retries/errors)

### **Per Hour:**
- **Maximum:** ~187 analyses per hour
- **Realistic:** ~125-150 analyses per hour

### **Data Considerations:**
Your error shows you're sending **a lot of data** to AI. Each analysis might use:
- **10,000-50,000 tokens** for comprehensive user data
- **Large datasets** = fewer total analyses possible
- **Token limits** may be hit before request limits

## 🔧 **Improvements Made:**

### **1. Better Key Rotation:**
```javascript
// Now tries all 3 keys in sequence
// Key 1 → Key 2 → Key 3 → Fail with clear message
```

### **2. Enhanced Error Handling:**
```javascript
// Specific handling for:
- Quota exceeded (429)
- Model overloaded (503) ← Your current issue
- Invalid API key (401)
- Rate limiting
```

### **3. Exponential Backoff:**
```javascript
// For overloaded models:
- Attempt 1: Wait 5 seconds
- Attempt 2: Wait 10 seconds  
- Attempt 3: Wait 20 seconds
- Max wait: 60 seconds
```

### **4. Better Error Messages:**
- Clear distinction between quota and overload issues
- Helpful suggestions for each error type
- Status information about available keys

## ⚠️ **Your Current Error Explanation:**

**"The model is overloaded"** means:
- Google's servers are temporarily overwhelmed
- **Not a quota issue** - it's a capacity issue
- Happens during peak usage times
- **Temporary** - usually resolves in 1-2 minutes

## 💡 **Solutions & Recommendations:**

### **Immediate Fixes:**
1. **Wait 2-5 minutes** - overload usually temporary
2. **Retry analysis** - new system will auto-retry with backoff
3. **Try during off-peak hours** (early morning, late night)

### **Long-term Solutions:**

#### **1. Upgrade to Paid Tier:**
```
Gemini 1.5 Flash (Paid):
- RPM: 1,000 (vs 15 free)
- RPD: No limit (vs 1,500 free)
- Better availability
- Priority access
```

#### **2. Optimize Data Sent:**
```javascript
// Instead of sending ALL data:
- Send only relevant timeframe data
- Summarize large datasets
- Use data compression techniques
- Implement smart data filtering
```

#### **3. Add More API Keys:**
```bash
# You can create up to 5 API keys per project
GOOGLE_AI_API_KEY_4=...
GOOGLE_AI_API_KEY_5=...
```

#### **4. Implement Caching:**
```javascript
// Cache analysis results to avoid re-analyzing same data
- Store analysis results
- Check cache before new analysis
- Refresh cache periodically
```

## 🚀 **Enhanced Error Handling Now Active:**

### **Error Types & Actions:**
1. **503 Overloaded:** Auto-retry with backoff (5s, 10s, 20s)
2. **429 Quota:** Skip to next key, try again in 24h
3. **401 Invalid:** Skip key, try next one
4. **Rate Limit:** Wait 2s, try next key

### **Clear Error Messages:**
- **All models overloaded:** "Try again in 1-2 minutes"
- **Quota exceeded:** "Try again after midnight PST"
- **Partial issues:** Shows which keys work vs don't work

## 📈 **Monitoring Your Usage:**

### **Console Logs Now Show:**
```bash
🔄 Attempting AI analysis with API key 1...
❌ API key 1 failed: The model is overloaded
⏱️ Waiting 5000ms before next attempt...
🔄 Attempting AI analysis with API key 2...
✅ Successfully switched to API key 2 after 1 failed attempts
📊 Key 2 stats: 15/20 successful requests
```

### **Usage Statistics:**
- Success/failure rates per key
- Request counts per key
- Last used timestamps
- Quota status tracking

## 🎯 **Best Practices Moving Forward:**

### **1. Off-Peak Usage:**
- **Best times:** 2-6 AM PST, 10 PM - 2 AM PST
- **Avoid:** 9 AM - 5 PM PST (business hours)

### **2. Data Optimization:**
- Limit analysis to specific date ranges
- Don't send empty/null data fields
- Compress large text data
- Use summaries for historical data

### **3. Smart Retries:**
- Let the system auto-retry (now implemented)
- Don't immediately retry failed requests
- Space out bulk analysis operations

### **4. Monitor & Plan:**
- Track daily usage across all keys
- Plan for quota resets (midnight PST)
- Consider paid tier if doing >1000 analyses/day

## 🔧 **Testing the Fixes:**

1. **Try your analysis again** - should see improved error handling
2. **Check console logs** - detailed failure/retry information
3. **Wait during overload** - system will auto-retry with backoff
4. **Monitor success rates** - see which keys work best

The new system should handle the "overloaded" error much better with automatic retries and clearer error messages!
