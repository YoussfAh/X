import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const testUserDataAPI = async () => {
  await connectDB();
  
  try {
    // Import aggregation functions
    const {
      aggregateWorkoutData,
      aggregateSessionData,
      aggregateDietData,
      aggregateSleepData,
      aggregateWeightData,
      aggregateQuizData,
      calculateUserSummary
    } = await import('./utils/dataAggregation.js');
    
    // Test with a known user ID (replace with actual user ID)
    const testUserId = '676156e5e7d19f3f1a4ae3d0'; // Replace with your user ID
    
    console.log('Testing data aggregation for user:', testUserId);
    
    const userData = {
      workouts: await aggregateWorkoutData(testUserId, {}),
      sessions: await aggregateSessionData(testUserId, {}),
      diet: await aggregateDietData(testUserId, {}),
      sleep: await aggregateSleepData(testUserId, {}),
      weight: await aggregateWeightData(testUserId, {}),
      quizzes: await aggregateQuizData(testUserId, {})
    };
    
    console.log('Raw user data:');
    console.log('Workouts:', userData.workouts.length);
    console.log('Sessions:', userData.sessions.length);
    console.log('Diet:', userData.diet.length);
    console.log('Sleep:', userData.sleep.length);
    console.log('Weight:', userData.weight.length);
    console.log('Quizzes:', userData.quizzes.length);
    
    const summary = calculateUserSummary(userData);
    console.log('\nCalculated summary:', summary);
    
  } catch (error) {
    console.error('Test error:', error);
  }
  
  process.exit(0);
};

testUserDataAPI();
