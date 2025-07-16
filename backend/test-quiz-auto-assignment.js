import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Quiz from './models/quizModel.js';
import User from './models/userModel.js';

dotenv.config();

const testAutoAssignment = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Create a test time-based quiz if it doesn't exist
    let testQuiz = await Quiz.findOne({ name: 'Test Time-Based Quiz' });
    
    if (!testQuiz) {
      testQuiz = new Quiz({
        name: 'Test Time-Based Quiz',
        triggerType: 'TIME_INTERVAL',
        triggerDelayDays: 0, // Backward compatibility
        triggerDelayAmount: 30, // 30 seconds for quick testing
        triggerDelayUnit: 'seconds',
        triggerStartFrom: 'REGISTRATION',
        timeFrameHandling: 'ALL_USERS', // Test on all users
        respectUserTimeFrame: false,
        homePageMessage: 'Welcome! Take this quiz to get started.',
        isActive: true,
        questions: [
          {
            questionText: 'What is your primary fitness goal?',
            type: 'multiple-choice',
            options: [
              { text: 'Lose weight' },
              { text: 'Build muscle' },
              { text: 'Stay healthy' }
            ]
          }
        ]
      });
      
      await testQuiz.save();
      console.log('Test quiz created:', testQuiz.name);
    } else {
      console.log('Test quiz already exists:', testQuiz.name);
    }

    // Find a test user
    const testUser = await User.findOne({});
    if (!testUser) {
      console.log('No users found in database');
      return;
    }

    console.log('Testing with user:', testUser.email);
    console.log('User registration date:', testUser.createdAt);
    console.log('Current pending quizzes:', testUser.pendingQuizzes.length);
    console.log('Quiz trigger settings:');
    console.log('- Delay Amount:', testQuiz.triggerDelayAmount);
    console.log('- Delay Unit:', testQuiz.triggerDelayUnit);
    console.log('- Start From:', testQuiz.triggerStartFrom);
    console.log('- Time Frame Handling:', testQuiz.timeFrameHandling);

    // Calculate trigger time based on new enhanced fields
    const now = new Date();
    let referenceDate = new Date(testUser.createdAt); // Default to registration

    if (testQuiz.triggerStartFrom === 'FIRST_QUIZ' && testUser.quizResults.length > 0) {
      referenceDate = new Date(testUser.quizResults[0].completedAt);
    } else if (testQuiz.triggerStartFrom === 'LAST_QUIZ' && testUser.quizResults.length > 0) {
      const lastQuiz = testUser.quizResults[testUser.quizResults.length - 1];
      referenceDate = new Date(lastQuiz.completedAt);
    }

    // Calculate trigger date based on new delay system
    const triggerDate = new Date(referenceDate);
    const delayAmount = testQuiz.triggerDelayAmount || 0;
    
    switch (testQuiz.triggerDelayUnit) {
      case 'seconds':
        triggerDate.setSeconds(triggerDate.getSeconds() + delayAmount);
        break;
      case 'minutes':
        triggerDate.setMinutes(triggerDate.getMinutes() + delayAmount);
        break;
      case 'hours':
        triggerDate.setHours(triggerDate.getHours() + delayAmount);
        break;
      case 'days':
        triggerDate.setDate(triggerDate.getDate() + delayAmount);
        break;
      case 'weeks':
        triggerDate.setDate(triggerDate.getDate() + (delayAmount * 7));
        break;
    }

    console.log('Reference date used:', referenceDate);
    console.log('Quiz trigger date:', triggerDate);
    console.log('Current date:', now);
    console.log('Should assign quiz:', now >= triggerDate);
    console.log('Time difference (ms):', now.getTime() - triggerDate.getTime());

    // Check if already assigned
    const existingAssignment = testUser.pendingQuizzes.find(
      pendingQuiz => pendingQuiz.quizId.toString() === testQuiz._id.toString()
    );
    console.log('Already assigned:', !!existingAssignment);

    // Check if already completed
    const completedQuiz = testUser.quizResults.find(
      result => result.quizId.toString() === testQuiz._id.toString()
    );
    console.log('Already completed:', !!completedQuiz);

    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
};

testAutoAssignment();
