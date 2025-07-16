import mongoose from 'mongoose';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testTargetUserLogin() {
  try {
    console.log('=== Testing Target User Login and Quiz Access ===');

    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URI ||
        'mongodb+srv://pro-g:prog123@cluster0.a7kzq.mongodb.net/pro_g?retryWrites=true&w=majority&appName=Cluster0'
    );
    console.log('Connected to MongoDB');

    // Test user ID from the admin panel
    const targetUserId = '67f4139ef61083ea7f45e625';

    // Find the target user
    const targetUser = await User.findById(targetUserId).populate({
      path: 'pendingQuizzes.quizId',
      model: 'Quiz',
    });

    if (!targetUser) {
      console.log('❌ Target user not found');
      return;
    }

    console.log(`\n👤 Target User: ${targetUser.email}`);
    console.log(`User ID: ${targetUser._id}`);
    console.log(
      `Pending Quizzes Count: ${targetUser.pendingQuizzes?.length || 0}`
    );

    // Simulate what happens when this user logs in and accesses /quiz
    console.log('\n🔍 Simulating /api/quiz/active-for-user endpoint...');

    // Filter out pending quizzes where the quiz document no longer exists
    const validPendingQuizzes = targetUser.pendingQuizzes.filter((pending) => {
      if (pending.quizId) {
        return true; // Keep it, the quiz exists.
      }
      console.warn(
        `Data Integrity Warning: User '${targetUser.email}' has a pending quiz reference to a non-existent quiz.`
      );
      return false; // Discard it.
    });

    if (validPendingQuizzes.length === 0) {
      console.log('❌ No valid pending quizzes found. API would return null.');
      return;
    }

    // Sort by assignment date (oldest first)
    const sortedPendingQuizzes = validPendingQuizzes.sort(
      (a, b) => new Date(a.assignedAt) - new Date(b.assignedAt)
    );

    console.log(
      `\n📋 Processing ${sortedPendingQuizzes.length} pending quizzes in order:`
    );

    let eligibleQuiz = null;
    const now = new Date();

    for (const pendingQuiz of sortedPendingQuizzes) {
      const quiz = pendingQuiz.quizId;
      console.log(
        `\n--- Evaluating quiz: "${quiz.name}" (ID: ${quiz._id}) ---`
      );

      if (!quiz.isActive) {
        console.log(`❌ Quiz "${quiz.name}" is not active. Skipping.`);
        continue;
      }
      console.log(`✅ Quiz "${quiz.name}" is active.`);

      if (quiz.triggerType === 'ADMIN_ASSIGNMENT') {
        console.log(
          `✅ Quiz trigger type is "ADMIN_ASSIGNMENT". No time interval delay to check.`
        );

        // Check timeframe handling
        console.log(`Time frame handling: ${quiz.timeFrameHandling}`);

        if (quiz.timeFrameHandling === 'ALL_USERS') {
          console.log(`✅ Quiz allows all users regardless of time frame.`);
          eligibleQuiz = quiz;
          console.log(`*** Found eligible quiz: "${quiz.name}" ***`);
          break;
        } else if (quiz.timeFrameHandling === 'RESPECT_TIMEFRAME') {
          // Check if user is in appropriate time frame
          if (targetUser.timeFrame) {
            console.log(
              `✅ User has timeframe: ${targetUser.timeFrame}, quiz allows timeframe-specific users.`
            );
            eligibleQuiz = quiz;
            console.log(`*** Found eligible quiz: "${quiz.name}" ***`);
            break;
          } else {
            console.log(
              `❌ User has no timeframe, but quiz requires timeframe. Skipping.`
            );
            continue;
          }
        }
      } else if (quiz.triggerType === 'TIME_INTERVAL') {
        console.log(`⏰ Checking TIME_INTERVAL trigger...`);

        // For TIME_INTERVAL quizzes, check if scheduled time has passed
        if (
          pendingQuiz.scheduledFor &&
          new Date(pendingQuiz.scheduledFor) > now
        ) {
          console.log(
            `⏰ Quiz "${quiz.name}" is scheduled for ${pendingQuiz.scheduledFor}, but it's not time yet.`
          );
          continue;
        }

        // Check timeframe handling for TIME_INTERVAL
        if (quiz.timeFrameHandling === 'ALL_USERS') {
          console.log(
            `✅ TIME_INTERVAL quiz allows all users regardless of time frame.`
          );
          eligibleQuiz = quiz;
          console.log(`*** Found eligible quiz: "${quiz.name}" ***`);
          break;
        } else {
          console.log(
            `⏰ TIME_INTERVAL quiz respects timeframe - additional logic would be needed.`
          );
          eligibleQuiz = quiz;
          console.log(`*** Found eligible quiz: "${quiz.name}" ***`);
          break;
        }
      }
    }

    // Result
    if (eligibleQuiz) {
      console.log(`\n🎯 RESULT: /api/quiz/active-for-user would return:`);
      console.log(`  Quiz Name: ${eligibleQuiz.name}`);
      console.log(`  Quiz ID: ${eligibleQuiz._id}`);
      console.log(`  Questions: ${eligibleQuiz.questions?.length || 0}`);

      if (eligibleQuiz.questions && eligibleQuiz.questions.length > 0) {
        console.log(`\n📝 Quiz Questions:`);
        eligibleQuiz.questions.forEach((q, index) => {
          console.log(`  Q${index + 1}: ${q.text}`);
          q.options.forEach((opt, optIndex) => {
            console.log(
              `    ${String.fromCharCode(65 + optIndex)}) ${opt.text}`
            );
          });
        });
      }
    } else {
      console.log(
        `\n❌ RESULT: /api/quiz/active-for-user would return null (no eligible quiz)`
      );
    }

    // Test what /api/quiz endpoint would return
    console.log(`\n📜 RESULT: /api/quiz would return:`);
    const allEligibleQuizzes = validPendingQuizzes
      .map((pending) => pending.quizId)
      .filter((quiz) => quiz.isActive)
      .map((quiz) => ({
        _id: quiz._id,
        name: quiz.name,
        questions: quiz.questions?.length || 0,
      }));

    console.log(`  ${allEligibleQuizzes.length} quiz(es) total:`);
    allEligibleQuizzes.forEach((quiz) => {
      console.log(`  - ${quiz.name} (${quiz.questions} questions)`);
    });

    // Login simulation
    console.log(`\n🔐 To test this properly:`);
    console.log(`1. Login as user: ${targetUser.email}`);
    console.log(`2. Visit: http://localhost:3000/quiz`);
    console.log(
      `3. You should see: ${eligibleQuiz ? eligibleQuiz.name : 'No quiz'}`
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔐 Disconnected from MongoDB');
  }
}

testTargetUserLogin();
