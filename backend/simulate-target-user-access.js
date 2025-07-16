import mongoose from 'mongoose';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function simulateTargetUserQuizAccess() {
  try {
    console.log('=== SIMULATING TARGET USER QUIZ ACCESS ===');

    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URI ||
        'mongodb+srv://pro-g:prog123@cluster0.a7kzq.mongodb.net/pro_g?retryWrites=true&w=majority&appName=Cluster0'
    );
    console.log('✅ Connected to MongoDB');

    // Target user ID from admin panel
    const targetUserId = '67f4139ef61083ea7f45e625';

    console.log('\n🔍 STEP 1: Get Target User Data');
    const targetUser = await User.findById(targetUserId).populate({
      path: 'pendingQuizzes.quizId',
      model: 'Quiz',
    });

    if (!targetUser) {
      console.log('❌ Target user not found');
      return;
    }

    console.log(`👤 Target User: ${targetUser.email}`);
    console.log(`📝 Pending Quizzes: ${targetUser.pendingQuizzes.length}`);

    console.log(
      '\n🔍 STEP 2: Simulate /api/quiz/active-for-user for TARGET USER'
    );
    console.log(`--- Getting Active Quiz for User: ${targetUser.email} ---`);

    // Filter out pending quizzes where the quiz document no longer exists.
    const originalPendingCount = targetUser.pendingQuizzes.length;
    const validPendingQuizzes = targetUser.pendingQuizzes.filter((pending) => {
      if (pending.quizId) {
        return true; // Keep it, the quiz exists.
      }
      console.warn(
        `Data Integrity Warning: User '${targetUser.email}' has a pending quiz reference to a non-existent quiz.`
      );
      return false; // Discard it.
    });

    console.log(
      `✅ Valid pending quizzes: ${validPendingQuizzes.length}/${originalPendingCount}`
    );

    if (validPendingQuizzes.length === 0) {
      console.log(
        '❌ No valid pending quizzes found. Target user would see: NO QUIZ'
      );
      return;
    }

    // Find eligible quiz (same logic as backend)
    const now = new Date();
    let eligibleQuiz = null;

    const sortedPendingQuizzes = validPendingQuizzes.sort(
      (a, b) => new Date(a.assignedAt) - new Date(b.assignedAt)
    );

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
          if (targetUser.timeFrame && targetUser.timeFrame.isWithinTimeFrame) {
            console.log(
              `✅ User is within timeframe, quiz allows timeframe-specific users.`
            );
            eligibleQuiz = quiz;
            console.log(`*** Found eligible quiz: "${quiz.name}" ***`);
            break;
          } else {
            console.log(
              `❌ User not in timeframe or timeframe expired, but quiz requires timeframe. Skipping.`
            );
            continue;
          }
        }
      } else if (quiz.triggerType === 'TIME_INTERVAL') {
        console.log(`⏰ Quiz trigger type is "TIME_INTERVAL".`);

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
          console.log(`⏰ TIME_INTERVAL quiz respects timeframe.`);
          if (targetUser.timeFrame && targetUser.timeFrame.isWithinTimeFrame) {
            eligibleQuiz = quiz;
            console.log(`*** Found eligible quiz: "${quiz.name}" ***`);
            break;
          } else {
            console.log(
              `❌ User not in valid timeframe for TIME_INTERVAL quiz.`
            );
            continue;
          }
        }
      }
    }

    console.log('\n🎯 RESULT:');
    if (eligibleQuiz) {
      console.log(`✅ Target user WOULD see quiz: "${eligibleQuiz.name}"`);
      console.log(`   Questions: ${eligibleQuiz.questions?.length || 0}`);
      console.log(
        `   First question: "${
          eligibleQuiz.questions?.[0]?.questionText || 'No questions'
        }"`
      );
    } else {
      console.log(`❌ Target user would see: NO QUIZ (no eligible quiz found)`);
    }

    console.log('\n📋 TESTING INSTRUCTIONS:');
    console.log('1. Open NEW INCOGNITO WINDOW (to clear admin session)');
    console.log('2. Go to: http://localhost:3000/login');
    console.log(`3. Login with: ${targetUser.email} / 123456`);
    console.log('4. After login, go to: http://localhost:3000/quiz');
    console.log(
      `5. Expected result: ${
        eligibleQuiz ? `See "${eligibleQuiz.name}"` : 'No quiz available'
      }`
    );

    console.log('\n⚠️  IMPORTANT: Use incognito window or clear cookies!');
    console.log('   Current admin session is interfering with testing.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔐 Disconnected from MongoDB');
  }
}

simulateTargetUserQuizAccess();
