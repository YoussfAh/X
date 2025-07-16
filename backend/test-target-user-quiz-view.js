import mongoose from 'mongoose';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testTargetUserQuizView() {
  try {
    console.log('=== Testing Target User Quiz View ===');

    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URI ||
        'mongodb+srv://pro-g:prog123@cluster0.a7kzq.mongodb.net/pro_g?retryWrites=true&w=majority&appName=Cluster0'
    );
    console.log('Connected to MongoDB');

    // Test user ID from the admin panel
    const targetUserId = '67f4139ef61083ea7f45e625';

    // Find the target user
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      console.log('❌ Target user not found');
      return;
    }

    console.log(`\n📋 Target User: ${targetUser.email}`);
    console.log(
      `Pending Quizzes Count: ${targetUser.pendingQuizzes?.length || 0}`
    );

    // Show pending quizzes
    if (targetUser.pendingQuizzes && targetUser.pendingQuizzes.length > 0) {
      console.log('\n📝 Pending Quizzes:');
      for (const pendingQuiz of targetUser.pendingQuizzes) {
        console.log(`\n  Assignment: ${JSON.stringify(pendingQuiz, null, 2)}`);

        const quiz = await Quiz.findById(pendingQuiz.quizId);
        if (quiz) {
          console.log(`  ✅ Quiz Found: ${quiz.name} (${quiz._id})`);
          console.log(`    Status: ${quiz.isActive ? 'Active' : 'Inactive'}`);
          console.log(`    Trigger: ${quiz.triggerType}`);
          console.log(`    TimeFrame: ${quiz.timeFrameHandling}`);
        } else {
          console.log(`  ❌ ORPHANED QUIZ ID: ${pendingQuiz.quizId}`);
        }
      }
    } else {
      console.log('\n❌ No pending quizzes found for target user');
    }

    // Test what the active quiz endpoint would return for this user
    console.log('\n🔍 Testing Active Quiz Logic for Target User...');

    // Simulate the getActiveQuizForUser logic
    const activeQuizzes = await Quiz.find({
      isActive: true,
      $or: [{ triggerType: 'ADMIN_ASSIGNMENT' }, { triggerType: 'TIME_BASED' }],
    });

    console.log(`Found ${activeQuizzes.length} active quizzes in system`);

    for (const quiz of activeQuizzes) {
      console.log(`\n--- Evaluating quiz: "${quiz.name}" (${quiz._id}) ---`);

      // Check if user has pending assignment
      const hasPendingAssignment = targetUser.pendingQuizzes.some(
        (pending) =>
          pending.quizId && pending.quizId.toString() === quiz._id.toString()
      );
      console.log(`Has pending assignment: ${hasPendingAssignment}`);

      if (hasPendingAssignment) {
        console.log(
          `✅ Quiz "${quiz.name}" would be returned as active for target user`
        );

        // Show quiz details
        console.log(`Questions: ${quiz.questions?.length || 0}`);
        if (quiz.questions && quiz.questions.length > 0) {
          quiz.questions.forEach((q, index) => {
            console.log(`  Q${index + 1}: ${q.text}`);
            q.options.forEach((opt, optIndex) => {
              console.log(
                `    ${String.fromCharCode(65 + optIndex)}) ${opt.text}`
              );
            });
          });
        }
        break; // Only show first eligible quiz
      } else {
        console.log(`❌ Quiz "${quiz.name}" not assigned to target user`);
      }
    }

    // Test API endpoint simulation
    console.log('\n🌐 Simulating API Endpoint Calls...');

    // What /api/quiz/active-for-user would return for target user
    const eligibleQuizzes = activeQuizzes.filter((quiz) => {
      return targetUser.pendingQuizzes.some(
        (pending) =>
          pending.quizId && pending.quizId.toString() === quiz._id.toString()
      );
    });

    if (eligibleQuizzes.length > 0) {
      const firstEligible = eligibleQuizzes[0];
      console.log(
        `✅ /api/quiz/active-for-user would return: "${firstEligible.name}"`
      );
    } else {
      console.log(
        '❌ /api/quiz/active-for-user would return: null (no active quiz)'
      );
    }

    // What /api/quiz would return for target user
    const quizList = eligibleQuizzes.map((quiz) => ({
      _id: quiz._id,
      name: quiz.name,
      questions: quiz.questions?.length || 0,
    }));

    console.log(`✅ /api/quiz would return: ${quizList.length} quiz(es)`);
    quizList.forEach((quiz) => {
      console.log(`  - ${quiz.name} (${quiz.questions} questions)`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔐 Disconnected from MongoDB');
  }
}

testTargetUserQuizView();
