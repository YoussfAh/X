import mongoose from 'mongoose';
import Quiz from './models/quizModel.js';
import User from './models/userModel.js';
import connectDB from './config/db.js';

async function createTestQuiz() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Create a test quiz that should trigger immediately (1 minute delay)
    const testQuiz = await Quiz.create({
      name: 'Immediate Test Quiz',
      triggerType: 'TIME_INTERVAL',
      triggerDelayAmount: 1,
      triggerDelayUnit: 'minutes',
      triggerStartFrom: 'REGISTRATION',
      timeFrameHandling: 'ALL_USERS',
      isActive: true,
      questions: [
        {
          questionText: 'How are you feeling today?',
          type: 'multiple-choice',
          options: [
            { text: 'Great!' },
            { text: 'Good' },
            { text: 'Okay' },
            { text: 'Not so good' },
          ],
        },
      ],
      homePageMessage: 'You have a quick check-in quiz available!',
    });

    console.log('Created test quiz:', testQuiz.name);
    console.log('Quiz ID:', testQuiz._id);
    console.log('Will trigger 1 minute after user registration');

    // Check test user
    const testUser = await User.findById('67f4139ef61083ea7f45e625');
    if (testUser) {
      console.log('\\nTest user found:', testUser.name, testUser.email);
      console.log('User registered:', testUser.createdAt);
      console.log('Current pending quizzes:', testUser.pendingQuizzes.length);

      // Calculate when this quiz should be assigned
      const registrationTime = new Date(testUser.createdAt);
      const triggerTime = new Date(registrationTime.getTime() + 1 * 60 * 1000); // 1 minute later
      const now = new Date();

      console.log('\\nTiming:');
      console.log('Registration time:', registrationTime);
      console.log('Should trigger at:', triggerTime);
      console.log('Current time:', now);
      console.log('Should be assigned:', now >= triggerTime ? 'YES' : 'NO');

      if (now >= triggerTime) {
        console.log(
          '\\n✅ Quiz should be assigned immediately by auto-assignment!'
        );
      } else {
        const timeToWait = triggerTime - now;
        console.log(
          `\\n⏱️ Quiz will be assigned in ${Math.ceil(
            timeToWait / 1000
          )} seconds`
        );
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestQuiz();
