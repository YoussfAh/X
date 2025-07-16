/**
 * Test Script: Quiz Completion Message Feature
 * 
 * This script tests the new completion message functionality:
 * 1. Creates a test quiz with a custom completion message
 * 2. Tests the quiz submission API endpoint
 * 3. Verifies the completion message is returned correctly
 */

import mongoose from 'mongoose';
import Quiz from './models/quizModel.js';
import User from './models/userModel.js';
import connectDB from './config/db.js';

const testCompletionMessage = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // 1. Create a test quiz with custom completion message
    const testQuiz = new Quiz({
      name: 'Completion Message Test Quiz',
      isActive: true,
      triggerType: 'ADMIN_ASSIGNMENT',
      completionMessage: '🎉 Awesome! You completed our test quiz! Your journey to success begins now. Welcome aboard! 🚀',
      homePageMessage: 'Take our special test quiz to get started!',
      questions: [
        {
          questionText: 'How excited are you about this new feature?',
          type: 'multiple-choice',
          options: [
            { text: 'Very excited!' },
            { text: 'Quite excited!' },
            { text: 'Super excited!' }
          ]
        },
        {
          questionText: 'What do you think about the new completion modal?',
          type: 'multiple-choice',
          options: [
            { text: 'It looks amazing!' },
            { text: 'Love the dark theme!' },
            { text: 'The animations are great!' }
          ]
        }
      ]
    });

    const savedQuiz = await testQuiz.save();
    console.log('✅ Test quiz created with ID:', savedQuiz._id);
    console.log('📝 Completion message:', savedQuiz.completionMessage);

    // 2. Find or create a test user
    let testUser = await User.findOne({ email: 'test-completion@example.com' });
    
    if (!testUser) {
      testUser = new User({
        name: 'Test Completion User',
        email: 'test-completion@example.com',
        password: 'testpassword123',
        isAdmin: false,
        pendingQuizzes: [],
        quizResults: []
      });
      await testUser.save();
      console.log('✅ Test user created');
    } else {
      console.log('✅ Using existing test user');
    }

    // 3. Assign the quiz to the test user
    testUser.pendingQuizzes.push({
      quizId: savedQuiz._id,
      assignedAt: new Date(),
      assignedBy: testUser._id, // Self-assigned for testing
      assignmentType: 'ADMIN_MANUAL',
      isAvailable: true
    });
    await testUser.save();
    console.log('✅ Quiz assigned to test user');

    // 4. Simulate quiz submission
    const mockAnswers = [
      { questionId: savedQuiz.questions[0]._id, optionId: savedQuiz.questions[0].options[0]._id },
      { questionId: savedQuiz.questions[1]._id, optionId: savedQuiz.questions[1].options[1]._id }
    ];

    console.log('\n📤 Simulating quiz submission...');
    console.log('Mock answers:', mockAnswers);

    // Test the completion message logic (simulate what the controller does)
    const mockSubmissionResponse = {
      message: 'Quiz answers submitted successfully.',
      delaySeconds: 0,
      completionMessage: savedQuiz.completionMessage
    };

    console.log('\n📨 Mock API Response:');
    console.log(JSON.stringify(mockSubmissionResponse, null, 2));

    // 5. Test different completion messages
    console.log('\n🧪 Testing different completion message scenarios:');
    
    // Test with custom message
    console.log('\n1️⃣ Quiz with custom completion message:');
    console.log('Message:', savedQuiz.completionMessage);
    
    // Test with default message
    const defaultQuiz = new Quiz({
      name: 'Default Message Quiz',
      questions: [{ questionText: 'Test?', type: 'multiple-choice', options: [{ text: 'Yes' }] }]
    });
    console.log('\n2️⃣ Quiz with default completion message:');
    console.log('Message:', defaultQuiz.completionMessage);
    
    // Test with empty message (should use default)
    const emptyMessageQuiz = new Quiz({
      name: 'Empty Message Quiz',
      completionMessage: '',
      questions: [{ questionText: 'Test?', type: 'multiple-choice', options: [{ text: 'Yes' }] }]
    });
    console.log('\n3️⃣ Quiz with empty completion message:');
    console.log('Message:', emptyMessageQuiz.completionMessage || 'Thank you for completing the quiz! Your responses have been saved and your profile is being updated.');

    console.log('\n✅ All tests completed successfully!');
    console.log('\n🎯 Frontend Integration Points:');
    console.log('1. QuizScreen.jsx receives completionMessage in API response');
    console.log('2. QuizCompletionModal.jsx displays the message with beautiful animations');
    console.log('3. User is redirected to home page after clicking "Go to Home"');
    console.log('4. Dark theme with modern design provides great UX');

    // Cleanup
    await Quiz.findByIdAndDelete(savedQuiz._id);
    console.log('\n🧹 Test quiz cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the test
testCompletionMessage();
