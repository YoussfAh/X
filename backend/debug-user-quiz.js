import dotenv from 'dotenv';
dotenv.config();
import connectDB from './config/db.js';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';

async function debugUserQuizzes() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Test with the user ID from the URL you mentioned
    const userId = '6858740544e9650a43d091ad';

    console.log(`\n=== Debugging User Quizzes ===`);
    console.log(`User ID: ${userId}`);

    const user = await User.findById(userId).select(
      'email pendingQuizzes quizResults skippedQuizzes'
    );
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log(`✅ User found: ${user.email}`);
    console.log(`Pending Quizzes: ${user.pendingQuizzes.length}`);
    console.log(
      `Completed Quizzes: ${user.quizResults ? user.quizResults.length : 0}`
    );
    console.log(
      `Skipped Quizzes: ${user.skippedQuizzes ? user.skippedQuizzes.length : 0}`
    );

    // Check each pending quiz
    console.log(`\n=== Pending Quiz Details ===`);
    for (let i = 0; i < user.pendingQuizzes.length; i++) {
      const pendingQuiz = user.pendingQuizzes[i];
      const quiz = await Quiz.findById(pendingQuiz.quizId);

      console.log(`\n${i + 1}. Quiz ID: ${pendingQuiz.quizId}`);
      console.log(`   Name: ${quiz ? quiz.name : '❌ QUIZ NOT FOUND'}`);
      console.log(`   Active: ${quiz ? quiz.isActive : 'N/A'}`);
      console.log(`   Available: ${pendingQuiz.isAvailable}`);
      console.log(`   Assigned: ${pendingQuiz.assignedAt}`);
      console.log(`   Type: ${pendingQuiz.assignmentType || 'MANUAL'}`);

      if (!quiz) {
        console.log(
          `   ❌ ERROR: This quiz doesn't exist but is still assigned!`
        );
      } else if (!quiz.isActive) {
        console.log(`   ⚠️  WARNING: Quiz is inactive but still assigned!`);
      }
    }

    // Test what the getActiveQuizForUser endpoint would return
    console.log(`\n=== Active Quiz Test (simulating /quiz endpoint) ===`);

    let foundActiveQuiz = false;
    for (const pendingQuiz of user.pendingQuizzes) {
      if (!pendingQuiz.isAvailable) continue;

      const quiz = await Quiz.findById(pendingQuiz.quizId);
      if (!quiz || !quiz.isActive) continue;

      console.log(`✅ Active quiz found: ${quiz.name}`);
      console.log(`   This is what the user would see at /quiz`);
      foundActiveQuiz = true;
      break;
    }

    if (!foundActiveQuiz) {
      console.log(
        `✅ No active quiz found - user would see "no quizzes available"`
      );
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugUserQuizzes();
