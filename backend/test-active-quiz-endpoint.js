import dotenv from 'dotenv';
dotenv.config();
import connectDB from './config/db.js';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';

async function testActiveQuizEndpoint() {
  try {
    await connectDB();
    console.log('Connected to database');

    const userId = '6858740544e9650a43d091ad';

    // Simulate the getActiveQuizForUser endpoint logic
    const user = await User.findById(userId).populate({
      path: 'pendingQuizzes.quizId',
      model: 'Quiz',
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log(`\n=== Simulating /api/quiz/active-for-user ===`);
    console.log(`User: ${user.email}`);
    console.log(
      `Time Frame: ${user.timeFrame?.isWithinTimeFrame ? 'WITHIN' : 'OUTSIDE'}`
    );
    console.log(`Pending Quizzes: ${user.pendingQuizzes.length}`);

    // Find eligible quiz (same logic as backend)
    let eligibleQuiz = null;
    const sortedPendingQuizzes = user.pendingQuizzes.sort(
      (a, b) => new Date(a.assignedAt) - new Date(b.assignedAt)
    );

    for (const pendingQuiz of sortedPendingQuizzes) {
      const quiz = pendingQuiz.quizId;

      if (!quiz) {
        console.log(`Skipping null quiz reference`);
        continue;
      }

      console.log(`\nEvaluating: "${quiz.name}"`);

      if (!quiz.isActive) {
        console.log(`- Skipped: Quiz is not active`);
        continue;
      }

      // Check time frame restrictions
      const timeFrameHandling = quiz.timeFrameHandling || 'RESPECT_TIMEFRAME';
      console.log(`- Time Frame Handling: ${timeFrameHandling}`);
      console.log(
        `- User Time Frame Status: ${
          user.timeFrame?.isWithinTimeFrame ? 'WITHIN' : 'OUTSIDE'
        }`
      );

      let allowed = true;
      switch (timeFrameHandling) {
        case 'RESPECT_TIMEFRAME':
          if (!user.timeFrame?.isWithinTimeFrame) {
            console.log(`- Blocked: User is outside time frame`);
            allowed = false;
          }
          break;
        case 'OUTSIDE_TIMEFRAME_ONLY':
          if (user.timeFrame?.isWithinTimeFrame) {
            console.log(`- Blocked: Quiz is for users outside time frame only`);
            allowed = false;
          }
          break;
        case 'ALL_USERS':
          console.log(`- Allowed: Quiz allows all users`);
          break;
        default:
          if (quiz.respectUserTimeFrame && !user.timeFrame?.isWithinTimeFrame) {
            console.log(`- Blocked: Legacy time frame restriction`);
            allowed = false;
          }
          break;
      }

      if (allowed) {
        console.log(`✅ ELIGIBLE: "${quiz.name}"`);
        eligibleQuiz = quiz;
        break;
      }
    }

    console.log(`\n=== Result ===`);
    if (eligibleQuiz) {
      console.log(`✅ Active quiz found: "${eligibleQuiz.name}"`);
      console.log(`User will see this quiz at /quiz endpoint`);
    } else {
      console.log(`❌ No active quiz found`);
      console.log(`User will see "no quizzes available" message`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testActiveQuizEndpoint();
