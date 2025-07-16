import mongoose from 'mongoose';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testQuizEndpointLogic() {
  try {
    console.log('=== TESTING QUIZ ENDPOINT LOGIC ===');

    // Simulate the getActiveQuizForUser logic
    const userId = '67f4139ef61083ea7f45e625';
    const user = await User.findById(userId).populate({
      path: 'pendingQuizzes.quizId',
      model: 'Quiz',
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`User: ${user.email}`);
    console.log(
      `User time frame: ${user.timeFrame?.from || 'No start'} - ${
        user.timeFrame?.to || 'No end'
      }`
    );

    // Filter valid pending quizzes
    const validPendingQuizzes = user.pendingQuizzes.filter(
      (pending) => pending.quizId
    );
    console.log(`Valid pending quizzes: ${validPendingQuizzes.length}`);

    if (validPendingQuizzes.length === 0) {
      console.log('❌ No valid pending quizzes found');
      return;
    }

    // Test each quiz
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

      // Handle time frame
      const timeFrameHandling = quiz.timeFrameHandling || 'RESPECT_TIMEFRAME';
      console.log(`Time frame handling: ${timeFrameHandling}`);

      switch (timeFrameHandling) {
        case 'RESPECT_TIMEFRAME':
          if (!user.timeFrame || !user.timeFrame.from || !user.timeFrame.to) {
            console.log(
              '❌ User has no time frame, but quiz requires it. Skipping.'
            );
            continue;
          }

          // Parse time frame
          const [fromHour, fromMinute] = user.timeFrame.from
            .split(':')
            .map(Number);
          const [toHour, toMinute] = user.timeFrame.to.split(':').map(Number);

          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentTime = currentHour * 60 + currentMinute;
          const fromTime = fromHour * 60 + fromMinute;
          const toTime = toHour * 60 + toMinute;

          console.log(
            `Current time: ${currentHour}:${currentMinute
              .toString()
              .padStart(2, '0')} (${currentTime} minutes)`
          );
          console.log(`User time frame: ${fromTime} - ${toTime} minutes`);

          let isWithinTimeFrame;
          if (fromTime <= toTime) {
            isWithinTimeFrame =
              currentTime >= fromTime && currentTime <= toTime;
          } else {
            isWithinTimeFrame =
              currentTime >= fromTime || currentTime <= toTime;
          }

          if (!isWithinTimeFrame) {
            console.log(
              '❌ User is outside their allowed time frame. Skipping.'
            );
            continue;
          }
          console.log('✅ User is within their allowed time frame.');
          break;

        case 'ALL_USERS':
          console.log('✅ Quiz allows all users regardless of time frame.');
          break;

        case 'OUTSIDE_TIMEFRAME_ONLY':
          // Check if user is outside time frame
          if (user.timeFrame && user.timeFrame.from && user.timeFrame.to) {
            const [fromHour2, fromMinute2] = user.timeFrame.from
              .split(':')
              .map(Number);
            const [toHour2, toMinute2] = user.timeFrame.to
              .split(':')
              .map(Number);
            const currentTime2 = now.getHours() * 60 + now.getMinutes();
            const fromTime2 = fromHour2 * 60 + fromMinute2;
            const toTime2 = toHour2 * 60 + toMinute2;

            let isWithinTimeFrame2;
            if (fromTime2 <= toTime2) {
              isWithinTimeFrame2 =
                currentTime2 >= fromTime2 && currentTime2 <= toTime2;
            } else {
              isWithinTimeFrame2 =
                currentTime2 >= fromTime2 || currentTime2 <= toTime2;
            }

            if (isWithinTimeFrame2) {
              console.log(
                '❌ User is within time frame, but quiz is only for users outside time frame. Skipping.'
              );
              continue;
            }
            console.log(
              '✅ User is outside time frame, which matches quiz requirement.'
            );
          } else {
            console.log(
              '✅ User has no time frame, which counts as outside time frame.'
            );
          }
          break;
      }

      console.log(`🎯 *** FOUND ELIGIBLE QUIZ: "${quiz.name}" ***`);
      eligibleQuiz = quiz;
      break;
    }

    if (!eligibleQuiz) {
      console.log(
        '\n❌ NO ELIGIBLE QUIZ FOUND - User will see empty quiz page'
      );
    } else {
      console.log(
        `\n🚀 SUCCESS: User should see quiz "${eligibleQuiz.name}" at /quiz endpoint!`
      );
      console.log(`Quiz has ${eligibleQuiz.questions?.length || 0} questions`);
    }

    return eligibleQuiz;
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

testQuizEndpointLogic();
