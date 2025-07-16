# AI-Powered Nutrition Analysis Documentation

## Overview
This feature integrates Google AI Gemini to automatically analyze meal images and provide accurate nutrition estimates including calories, protein, carbs, fat, and fiber.

## Setup Instructions

### 1. Get Google AI API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Environment Configuration

Add the following environment variable to your backend `.env` file:
```env
GOOGLE_AI_API_KEY=your_api_key_here
```

### 3. Vercel Deployment
For Vercel deployment, add the environment variable in your Vercel dashboard:
1. Go to your project dashboard on Vercel
2. Navigate to Settings > Environment Variables
3. Add `GOOGLE_AI_API_KEY` with your API key value
4. Make sure it's available for all environments (Production, Preview, Development)

## Features

### AI-Powered Analysis
- **Image Recognition**: Analyzes uploaded meal images using Google Gemini Vision
- **Nutrition Estimation**: Provides accurate estimates for:
  - Calories
  - Protein (grams)
  - Carbohydrates (grams)
  - Fat (grams)
  - Fiber (grams)
- **Confidence Scoring**: Returns confidence level (high/medium/low)
- **Contextual Analysis**: Uses meal name and description for better accuracy

### Fallback System
If AI analysis fails, the system provides intelligent fallback estimates based on:
- Meal name keywords
- Description content
- Common nutrition patterns for similar foods

### Smart Features
- **Automatic Population**: Fills nutrition fields automatically after analysis
- **Visual Feedback**: Shows analysis progress with loading indicators
- **Error Handling**: Graceful fallback with helpful error messages
- **User Control**: Users can still manually edit values after AI analysis

## Usage

### For Users
1. **Upload Image**: Use the "Upload Meal Image" tab in diet tracking
2. **Enter Details**: Add meal name and optional description
3. **AI Analysis**: Click "Analyze Nutrition with AI" button
4. **Review Results**: Check the automatically filled nutrition values
5. **Manual Adjustments**: Edit any values if needed
6. **Save Meal**: Log the meal with complete nutrition data

### For Developers
The AI analysis is handled by the following components:

**Backend**:
- `services/geminiService.js` - Core AI integration
- `routes/nutritionRoutes.js` - API endpoint
- `controllers/nutritionController.js` - Request handling

**Frontend**:
- `slices/nutritionApiSlice.js` - API slice for nutrition analysis
- `AddDietEntryScreen.jsx` - UI integration with AI button

## API Endpoint

### POST `/api/nutrition/analyze`
Analyzes a meal image and returns nutrition estimates.

**Request Body**:
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "mealName": "Grilled Chicken Salad",
  "description": "Mixed greens with grilled chicken breast, cherry tomatoes, cucumbers"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "calories": 420,
    "protein": 35.5,
    "carbs": 15.2,
    "fat": 18.0,
    "fiber": 8.5,
    "confidence": "high",
    "analysis": "Grilled chicken salad with visible protein and vegetables"
  }
}
```

## Cost Optimization

### Free Tier Usage
- Google AI Studio provides free tier access
- Suitable for personal projects and small-scale applications
- Monitor usage through Google AI Studio dashboard

### Alternative Free AI Options
If you prefer free alternatives, consider:

1. **Ollama (Local)**:
   - Run models locally for zero cost
   - Requires server resources
   - Good for privacy-conscious applications

2. **Hugging Face API**:
   - Free tier available
   - Vision models like BLIP-2
   - Good community support

3. **OpenAI Free Tier**:
   - Limited free credits
   - GPT-4 Vision capabilities
   - Higher accuracy but limited usage

## Implementation Notes

### Image Processing
- Supports Cloudinary URLs (automatically converts to base64)
- Handles various image formats (JPEG, PNG, WebP)
- Optimized for food photography

### Error Handling
- Network failures trigger fallback nutrition estimation
- Invalid API keys return meaningful error messages
- Rate limiting is handled gracefully

### Performance
- Analysis typically takes 2-5 seconds
- Results are cached on the frontend
- Fallback estimates are instant

## Security Considerations

### API Key Protection
- Never expose API keys in frontend code
- Use environment variables for all sensitive data
- Rotate keys regularly for production apps

### Image Privacy
- Images are sent to Google AI for analysis
- Consider implementing image preprocessing for privacy
- Inform users about data usage in privacy policy

## Troubleshooting

### Common Issues

1. **"AI analysis failed"**
   - Check if GOOGLE_AI_API_KEY is set correctly
   - Verify API key is valid in Google AI Studio
   - Check network connectivity

2. **"Using fallback method"**
   - API quota exceeded
   - Temporary service issues
   - Still provides reasonable estimates

3. **No nutrition values returned**
   - Image quality may be too low
   - Meal not clearly visible in image
   - Try different angle or lighting

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
```

This will log detailed analysis information to the console.

## Future Enhancements

### Planned Features
- **Multi-language Support**: Analysis in different languages
- **Dietary Restrictions**: Consider allergies and dietary preferences
- **Meal Planning**: Suggest nutrition improvements
- **Batch Processing**: Analyze multiple images at once
- **Historical Learning**: Improve accuracy based on user corrections

### Integration Opportunities
- **Barcode Scanning**: Combine with packaged food database
- **Recipe Integration**: Link to recipe databases
- **Health Goals**: Align with user fitness objectives
- **Social Features**: Share analyzed meals with community

## Support

For technical support or feature requests:
1. Check this documentation first
2. Review error logs in development console
3. Test with different images to isolate issues
4. Contact development team with specific error messages

---

**Note**: This feature requires an active internet connection and valid Google AI API key. Fallback nutrition estimation works offline but with reduced accuracy.
