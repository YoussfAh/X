# Quick Setup Guide for AI Nutrition Analysis

## 🚀 Quick Start

### 1. Environment Setup
Add to your `.env` file:
```env
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

### 2. Get Google AI API Key
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy and paste into `.env` file

### 3. For Vercel Deployment
Add `GOOGLE_AI_API_KEY` as environment variable in Vercel dashboard.

## 🎯 How It Works

1. **Upload Image**: User uploads meal photo
2. **Enter Details**: Add meal name + description
3. **AI Analysis**: Click "Analyze Nutrition with AI"
4. **Auto-Fill**: Nutrition values populated automatically
5. **Save**: Log meal with complete nutrition data

## 💡 Features

- **Smart Analysis**: Uses Google Gemini Vision AI
- **Fallback System**: Works even if AI fails
- **Cost Effective**: Free tier available
- **Accurate**: Considers portion sizes and cooking methods

## 🔧 Alternative Free AI Options

If you prefer other free options:

### Option 1: Hugging Face (Free Tier)
```bash
npm install @huggingface/inference
```

### Option 2: Ollama (Local - Zero Cost)
```bash
# Run locally for completely free usage
curl https://ollama.ai/install.sh | sh
ollama run llava
```

### Option 3: OpenAI Free Credits
```bash
npm install openai
# Uses GPT-4 Vision (more accurate but limited free usage)
```

## 📊 Example Response

```json
{
  "calories": 420,
  "protein": 35.5,
  "carbs": 15.2,
  "fat": 18.0,
  "fiber": 8.5,
  "confidence": "high"
}
```

## 🛠️ Troubleshooting

- **No API Key**: Add `GOOGLE_AI_API_KEY` to environment
- **Analysis Failed**: Falls back to smart estimation
- **Poor Results**: Ensure clear, well-lit food photos

---

✅ **Ready to use!** The feature is now integrated into the "Upload Meal Image" tab.
