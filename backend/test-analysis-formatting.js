// Test the improved AI analysis with formatting
import ResponseFormatter from './utils/responseFormatter.js';

const testAIAnalysis = async () => {
  console.log('🧪 Testing AI Analysis with Response Formatting...');

  const sampleRawResponse = `
**Comprehensive Fitness Analysis**

**Key Findings:**

Your fitness journey is showing excellent progress! Based on your data, I can see consistent improvement across multiple areas.

* **Workout Consistency:** You've maintained 4 sessions per week for the past month - outstanding dedication!
* **Strength Progress:** Your deadlift has increased from 120kg to 140kg (17% improvement)
* **Recovery:** Average sleep duration of 7.5 hours with good consistency

**Performance Analysis:**

**Training Volume:**
* Total weekly volume: 3,200kg (up 20% from last month)
* Progressive overload successfully applied across all major lifts
* Exercise variety: 15 different movements for balanced development

**Recovery Metrics:**
* Sleep quality score: 85% (excellent range)
* Rest day adherence: 3 days per week as planned
* Post-workout nutrition timing: Within 30 minutes - perfect!

**Recommendations:**

**This Week's Focus:**
* Increase protein intake to 2.0g per kg body weight for optimal recovery
* Add 2 mobility sessions to prevent tightness
* Track water intake - aim for 3 liters daily

**Next Month's Goals:**
* Target 150kg deadlift by month end
* Introduce cardio: 2x 20-minute sessions weekly
* Perfect bench press form at current weights before increasing

**Action Items:**

1. Schedule meal prep Sunday for consistent nutrition
2. Book form check session with trainer this week
3. Set up sleep tracking for better recovery insights

You're crushing your goals! Keep up the fantastic work and remember that consistency beats perfection every time.
`;

  // Test the formatter
  const formatted = ResponseFormatter.formatResponse(sampleRawResponse);
  const summary = ResponseFormatter.createSummary(formatted);

  console.log('📊 Formatted Response:');
  console.log('=' .repeat(60));
  console.log(formatted);
  
  console.log('\n📈 Analysis Summary:');
  console.log('=' .repeat(60));
  console.log(JSON.stringify(summary, null, 2));

  console.log('\n✅ Test completed! The response should now be much more readable.');
};

testAIAnalysis().catch(console.error);
