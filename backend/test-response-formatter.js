// Test the response formatter with sample AI output
import ResponseFormatter from './utils/responseFormatter.js';

const sampleAIResponse = `
***Comprehensive Health & Fitness Analysis***

***Key Findings:***

**Your fitness journey shows promising momentum!** Based on your recent activity data, I can see you're building consistency in your workout routine. ***Here are the most important insights:***

* **Workout Consistency:** You've maintained a solid 3-4 sessions per week, which is excellent for building lasting habits.
* **Strength Progress:** Your bench press has increased from 70kg to 85kg over the past month - a 21% improvement!
* **Sleep Quality:** Your average sleep duration of 7.2 hours is within the optimal range, though consistency could improve.

***Performance Analysis:***

**Strength Training Metrics:**
* **Total weekly volume:** 2,840kg (up 15% from last month)
* **Progressive overload:** Successfully increasing weights across major lifts
* **Exercise variety:** 12 different exercises - good for balanced development

**Recovery Patterns:**
* **Sleep consistency:** Varies between 6-9 hours nightly
* **Recommended improvement:** Aim for 7-8 hours consistently for better recovery

***Recommendations for Immediate Implementation:***

**This Week's Focus:**
* **Stabilize sleep schedule:** Set a consistent bedtime of 10:30 PM
* **Nutrition tracking:** Log at least 5 days to identify patterns
* **Form check:** Record bench press to ensure proper technique at higher weights

**This Month's Goals:**
* **Strength targets:** Aim for 90kg bench press by month-end
* **Consistency goal:** Maintain 4 workout sessions weekly
* **Recovery optimization:** Implement 10-minute post-workout stretching

***Next Steps & Long-Term Strategy:***

**Immediate Actions (Next 7 Days):**
* Schedule workouts in calendar for next week
* Set phone reminders for consistent bedtime
* Take progress photos for visual tracking

**Monthly Objectives:**
* Increase protein intake to 1.8g per kg body weight
* Add one cardio session weekly for cardiovascular health
* Track body measurements monthly for comprehensive progress monitoring

You're doing great! Keep building on this solid foundation.
`;

console.log('=== ORIGINAL RESPONSE ===');
console.log(sampleAIResponse);

console.log('\n=== FORMATTED RESPONSE ===');
const formatted = ResponseFormatter.formatResponse(sampleAIResponse);
console.log(formatted);

console.log('\n=== SUMMARY ===');
const summary = ResponseFormatter.createSummary(formatted);
console.log(JSON.stringify(summary, null, 2));
