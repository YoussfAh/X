import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';

dotenv.config();

const testUserQuizAccess = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const targetUserId = '6858740544e9650a43d091ad';

    // Simulate the getActiveQuizForUser functionality
    console.log('🧪 Testing quiz access for the target user...');

    const user = await User.findById(targetUserId).populate(
      'pendingQuizzes.quizId'
    );
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`\n👤 User: ${user.name} (${user.email})`);
    console.log(`📝 Pending quizzes: ${user.pendingQuizzes.length}`);
    console.log(`✅ Completed quizzes: ${user.quizResults.length}`);
    console.log(
      `⏰ User time frame status: ${
        user.timeFrame?.isWithinTimeFrame
          ? 'Within time frame'
          : 'Outside time frame'
      }`
    );

    if (user.pendingQuizzes.length === 0) {
      console.log('\n❌ No pending quizzes found for this user');
      return;
    }

    console.log('\n📋 Analyzing each pending quiz:');

    const now = new Date();
    let availableQuizCount = 0;

    for (const pendingQuiz of user.pendingQuizzes) {
      const quiz = pendingQuiz.quizId;
      console.log(`\n--- Quiz: ${quiz.name} ---`);
      console.log(`ID: ${quiz._id}`);
      console.log(`Active: ${quiz.isActive}`);
      console.log(`Questions: ${quiz.questions?.length || 0}`);
      console.log(`Assignment type: ${pendingQuiz.assignmentType}`);
      console.log(`Assigned at: ${pendingQuiz.assignedAt}`);
      console.log(`Scheduled for: ${pendingQuiz.scheduledFor || 'N/A'}`);
      console.log(`Is available flag: ${pendingQuiz.isAvailable}`);

      // Check TIME_INTERVAL specific logic
      if (quiz.triggerType === 'TIME_INTERVAL') {
        console.log('⏰ TIME_INTERVAL quiz - checking timing...');

        if (pendingQuiz.scheduledFor) {
          const scheduledDate = new Date(pendingQuiz.scheduledFor);
          const isTimeReached = now >= scheduledDate;
          console.log(`Scheduled time reached: ${isTimeReached}`);
          console.log(
            `Minutes since scheduled: ${Math.round(
              (now - scheduledDate) / (1000 * 60)
            )}`
          );
        }
      }

      // Check time frame handling
      const timeFrameHandling = quiz.timeFrameHandling || 'RESPECT_TIMEFRAME';
      console.log(`Time frame handling: ${timeFrameHandling}`);

      let isEligible = true;

      switch (timeFrameHandling) {
        case 'RESPECT_TIMEFRAME':
          if (!user.timeFrame?.isWithinTimeFrame) {
            console.log('⚠️ User outside time frame (RESPECT_TIMEFRAME)');
            // Note: The current code shows quiz anyway for admin visibility
          }
          break;
        case 'ALL_USERS':
          console.log('✅ ALL_USERS - no time frame restrictions');
          break;
        case 'OUTSIDE_TIMEFRAME_ONLY':
          if (user.timeFrame?.isWithinTimeFrame) {
            console.log(
              '⚠️ User within time frame but quiz is OUTSIDE_TIMEFRAME_ONLY'
            );
          }
          break;
        default:
          if (quiz.respectUserTimeFrame && !user.timeFrame?.isWithinTimeFrame) {
            console.log(
              '⚠️ Legacy: User outside time frame (respectUserTimeFrame)'
            );
          }
          break;
      }

      // Final eligibility check
      const isQuizAvailable =
        quiz.isActive &&
        quiz.questions &&
        quiz.questions.length > 0 &&
        pendingQuiz.isAvailable;

      console.log(
        `🎯 Final availability: ${
          isQuizAvailable ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'
        }`
      );

      if (isQuizAvailable) {
        availableQuizCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`Total pending quizzes: ${user.pendingQuizzes.length}`);
    console.log(`Available quizzes: ${availableQuizCount}`);

    if (availableQuizCount > 0) {
      console.log(
        `\n🎉 User should see ${availableQuizCount} quiz(s) at /quiz endpoint`
      );
    } else {
      console.log(
        `\n⚠️ User would see "No active quiz available" at /quiz endpoint`
      );
    }
  } catch (error) {
    console.error('❌ Error testing user quiz access:', error);
  } finally {
    mongoose.connection.close();
  }
};

testUserQuizAccess();
