import mongoose from 'mongoose';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function debugQuizReferences() {
  try {
    // Get the target user
    const targetUser = await User.findById('67f4139ef61083ea7f45e625');

    if (!targetUser) {
      console.log('❌ User not found!');
      return;
    }

    console.log('\n=== USER PENDING QUIZ REFERENCES ===');
    console.log(`User: ${targetUser.email}`);
    console.log(
      `Pending Quiz IDs:`,
      targetUser.pendingQuizzes.map((id) => id.toString())
    );

    // Check each quiz individually
    console.log('\n=== CHECKING EACH QUIZ INDIVIDUALLY ===');
    for (const quizId of targetUser.pendingQuizzes) {
      console.log(`\n--- Checking Quiz ID: ${quizId} ---`);

      const quiz = await Quiz.findById(quizId);
      if (quiz) {
        console.log(`✅ Quiz found: "${quiz.title}"`);
        console.log(`   Status: ${quiz.status}`);
        console.log(`   Trigger: ${quiz.trigger}`);
        console.log(`   Time Frame Handling: ${quiz.timeFrameHandling}`);
        console.log(
          `   Questions: ${quiz.questions ? quiz.questions.length : 0}`
        );
      } else {
        console.log(`❌ Quiz NOT found - orphaned reference!`);
      }
    }

    // Get all active quizzes to see what's available
    console.log('\n=== ALL ACTIVE QUIZZES IN SYSTEM ===');
    const allActiveQuizzes = await Quiz.find({ status: 'active' }).select(
      'title trigger timeFrameHandling'
    );
    console.log(`Found ${allActiveQuizzes.length} active quizzes:`);
    allActiveQuizzes.forEach((quiz) => {
      console.log(
        `- "${quiz.title}" (${quiz.trigger}, ${quiz.timeFrameHandling})`
      );
    });

    // Test the actual active quiz endpoint logic
    console.log('\n=== SIMULATING ACTIVE QUIZ ENDPOINT ===');

    // Get user with properly populated quizzes
    const userWithQuizzes = await User.findById(
      '67f4139ef61083ea7f45e625'
    ).populate({
      path: 'pendingQuizzes',
      model: 'Quiz',
      match: { status: 'active' }, // Only get active quizzes
    });

    if (
      !userWithQuizzes.pendingQuizzes ||
      userWithQuizzes.pendingQuizzes.length === 0
    ) {
      console.log('❌ No active pending quizzes after filtering!');
      return;
    }

    console.log(
      `Found ${userWithQuizzes.pendingQuizzes.length} active pending quizzes`
    );

    // Check time frame for each
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    console.log(
      `Current time: ${currentHour}:${currentMinute
        .toString()
        .padStart(2, '0')}`
    );

    for (const quiz of userWithQuizzes.pendingQuizzes) {
      if (!quiz) continue; // Skip null populated quizzes

      console.log(`\n--- Quiz: "${quiz.title}" ---`);

      if (quiz.timeFrameHandling === 'IGNORE_TIMEFRAME') {
        console.log(`🎯 AVAILABLE: "${quiz.title}" (ignores time frame)`);
        return quiz;
      }

      if (quiz.timeFrameHandling === 'RESPECT_TIMEFRAME') {
        const userTimeFrame = userWithQuizzes.timeFrame;
        if (!userTimeFrame || !userTimeFrame.from || !userTimeFrame.to) {
          console.log(`❌ User has no time frame, but quiz requires it`);
          continue;
        }

        const [fromHour, fromMinute] = userTimeFrame.from
          .split(':')
          .map(Number);
        const [toHour, toMinute] = userTimeFrame.to.split(':').map(Number);
        const fromTime = fromHour * 60 + fromMinute;
        const toTime = toHour * 60 + toMinute;

        let isWithinTimeFrame;
        if (fromTime <= toTime) {
          isWithinTimeFrame = currentTime >= fromTime && currentTime <= toTime;
        } else {
          isWithinTimeFrame = currentTime >= fromTime || currentTime <= toTime;
        }

        if (isWithinTimeFrame) {
          console.log(`🎯 AVAILABLE: "${quiz.title}" (within time frame)`);
          return quiz;
        } else {
          console.log(`❌ BLOCKED: "${quiz.title}" (outside time frame)`);
        }
      }
    }

    console.log('\n❌ NO QUIZZES AVAILABLE TO USER');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

debugQuizReferences();
