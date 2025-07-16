import dotenv from 'dotenv';
dotenv.config();
import connectDB from './config/db.js';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';

async function syncQuizSystem() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Test with the user ID from the URL you mentioned
    const userId = '6858740544e9650a43d091ad';

    console.log(`\n=== Quiz System Synchronization Test ===`);
    console.log(`User ID: ${userId}`);

    const user = await User.findById(userId).populate({
      path: 'pendingQuizzes.quizId',
      model: 'Quiz',
    });

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log(`✅ User found: ${user.email}`);
    console.log(
      `Time Frame Status: ${
        user.timeFrame?.isWithinTimeFrame ? 'WITHIN' : 'OUTSIDE'
      } time frame`
    );
    console.log(`Pending Quizzes: ${user.pendingQuizzes.length}`);

    // Analyze each pending quiz
    console.log(`\n=== Detailed Quiz Analysis ===`);
    let availableCount = 0;
    let blockedByTimeFrame = 0;
    let blockedByTriggerTime = 0;
    let inactiveQuizzes = 0;

    const now = new Date();

    for (let i = 0; i < user.pendingQuizzes.length; i++) {
      const pendingQuiz = user.pendingQuizzes[i];
      const quiz = pendingQuiz.quizId;

      // Handle null quiz references (orphaned assignments)
      if (!quiz) {
        console.log(
          `\n${i + 1}. [ORPHANED ASSIGNMENT] (${pendingQuiz.quizId})`
        );
        console.log(`   ❌ BLOCKED: Quiz no longer exists`);
        inactiveQuizzes++;
        continue;
      }

      console.log(`\n${i + 1}. "${quiz.name}" (${quiz._id})`);
      console.log(`   Active: ${quiz.isActive}`);
      console.log(`   Trigger Type: ${quiz.triggerType}`);
      console.log(
        `   Time Frame Handling: ${
          quiz.timeFrameHandling || 'RESPECT_TIMEFRAME'
        }`
      );

      // Check if quiz is active
      if (!quiz.isActive) {
        console.log(`   ❌ BLOCKED: Quiz is inactive`);
        inactiveQuizzes++;
        continue;
      }

      // Check time interval trigger if applicable
      let triggerPassed = true;
      if (quiz.triggerType === 'TIME_INTERVAL') {
        // Calculate reference date
        let referenceDate;
        switch (quiz.triggerStartFrom) {
          case 'FIRST_QUIZ':
            if (user.quizResults && user.quizResults.length > 0) {
              const sortedResults = user.quizResults.sort(
                (a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)
              );
              referenceDate = new Date(sortedResults[0].submittedAt);
            } else {
              referenceDate = new Date(user.createdAt);
            }
            break;
          case 'LAST_QUIZ':
            if (user.quizResults && user.quizResults.length > 0) {
              const sortedResults = user.quizResults.sort(
                (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
              );
              referenceDate = new Date(sortedResults[0].submittedAt);
            } else {
              referenceDate = new Date(user.createdAt);
            }
            break;
          case 'REGISTRATION':
          default:
            referenceDate = new Date(user.createdAt);
            break;
        }

        // Calculate delay
        let delayMs = 0;
        const amount = quiz.triggerDelayAmount || quiz.triggerDelayDays || 0;
        const unit = quiz.triggerDelayUnit || 'days';

        if (amount > 0) {
          switch (unit) {
            case 'seconds':
              delayMs = amount * 1000;
              break;
            case 'minutes':
              delayMs = amount * 60 * 1000;
              break;
            case 'hours':
              delayMs = amount * 60 * 60 * 1000;
              break;
            case 'days':
              delayMs = amount * 24 * 60 * 60 * 1000;
              break;
            case 'weeks':
              delayMs = amount * 7 * 24 * 60 * 60 * 1000;
              break;
            default:
              delayMs = amount * 24 * 60 * 60 * 1000;
              break;
          }

          const triggerDate = new Date(referenceDate.getTime() + delayMs);
          triggerPassed = now >= triggerDate;

          console.log(
            `   Trigger: ${amount} ${unit} after ${quiz.triggerStartFrom}`
          );
          console.log(`   Reference Date: ${referenceDate.toISOString()}`);
          console.log(`   Trigger Date: ${triggerDate.toISOString()}`);
          console.log(`   Current Time: ${now.toISOString()}`);
          console.log(`   Trigger Passed: ${triggerPassed}`);
        }
      }

      if (!triggerPassed) {
        console.log(`   ⏰ BLOCKED: Trigger time not reached yet`);
        blockedByTriggerTime++;
        continue;
      }

      // Check time frame restrictions
      const timeFrameHandling = quiz.timeFrameHandling || 'RESPECT_TIMEFRAME';
      let timeFrameAllows = true;

      switch (timeFrameHandling) {
        case 'RESPECT_TIMEFRAME':
          timeFrameAllows = user.timeFrame?.isWithinTimeFrame;
          break;
        case 'ALL_USERS':
          timeFrameAllows = true;
          break;
        case 'OUTSIDE_TIMEFRAME_ONLY':
          timeFrameAllows = !user.timeFrame?.isWithinTimeFrame;
          break;
        default:
          // Legacy fallback
          if (quiz.respectUserTimeFrame) {
            timeFrameAllows = user.timeFrame?.isWithinTimeFrame;
          } else {
            timeFrameAllows = true;
          }
          break;
      }

      if (!timeFrameAllows) {
        console.log(
          `   🚫 BLOCKED: Time frame restriction (${timeFrameHandling})`
        );
        console.log(
          `   User is ${
            user.timeFrame?.isWithinTimeFrame ? 'WITHIN' : 'OUTSIDE'
          } time frame`
        );
        blockedByTimeFrame++;
        continue;
      }

      console.log(`   ✅ AVAILABLE: Quiz can be accessed by user`);
      availableCount++;
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total Pending Quizzes: ${user.pendingQuizzes.length}`);
    console.log(`✅ Available to User: ${availableCount}`);
    console.log(`🚫 Blocked by Time Frame: ${blockedByTimeFrame}`);
    console.log(`⏰ Blocked by Trigger Time: ${blockedByTriggerTime}`);
    console.log(`❌ Inactive Quizzes: ${inactiveQuizzes}`);

    console.log(`\n=== What User Sees ===`);
    if (availableCount > 0) {
      console.log(
        `✅ User should see ${availableCount} quiz(s) available at /quiz`
      );
    } else {
      console.log(`❌ User sees "no quizzes available" at /quiz`);
      console.log(`   Main reasons:`);
      if (blockedByTimeFrame > 0)
        console.log(
          `   - ${blockedByTimeFrame} blocked by time frame restrictions`
        );
      if (blockedByTriggerTime > 0)
        console.log(
          `   - ${blockedByTriggerTime} blocked by trigger time not reached`
        );
      if (inactiveQuizzes > 0)
        console.log(`   - ${inactiveQuizzes} inactive quizzes`);
    }

    console.log(`\n=== Admin Panel Should Show ===`);
    console.log(
      `- Pending Quizzes: ${user.pendingQuizzes.length} (with availability status)`
    );
    console.log(`- Clear indicators for why each quiz is/isn't available`);
    console.log(`- Time frame status and restrictions`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

syncQuizSystem();
