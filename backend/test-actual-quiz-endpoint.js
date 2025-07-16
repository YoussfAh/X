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

async function testActualQuizEndpoint() {
  try {
    // Get the target user
    const targetUser = await User.findById('67f4139ef61083ea7f45e625').populate(
      {
        path: 'pendingQuizzes',
        model: 'Quiz',
      }
    );

    if (!targetUser) {
      console.log('❌ User not found!');
      return;
    }

    console.log('\n=== TARGET USER ANALYSIS ===');
    console.log(`User: ${targetUser.email}`);
    console.log(
      `Time Frame: ${targetUser.timeFrame?.from || 'No start'} - ${
        targetUser.timeFrame?.to || 'No end'
      }`
    );
    console.log(`Pending Quizzes Count: ${targetUser.pendingQuizzes.length}`);

    // Test as admin user requesting
    const adminUser = await User.findOne({ email: 'admin@email.com' });
    console.log(`\nAdmin User: ${adminUser.email} (making the request)`);

    // Now test the actual active quiz logic
    console.log('\n=== TESTING ACTIVE QUIZ LOGIC ===');

    if (targetUser.pendingQuizzes.length === 0) {
      console.log('❌ No pending quizzes for this user');
      return;
    }

    for (const quiz of targetUser.pendingQuizzes) {
      console.log(`\n--- Testing Quiz: "${quiz.title}" ---`);
      console.log(`Quiz ID: ${quiz._id}`);
      console.log(`Quiz Status: ${quiz.status}`);
      console.log(`Quiz Trigger: ${quiz.trigger}`);
      console.log(`Time Frame Handling: ${quiz.timeFrameHandling}`);

      // Check if quiz is active
      if (quiz.status !== 'active') {
        console.log(`❌ Quiz is not active (status: ${quiz.status})`);
        continue;
      }

      // Check time frame handling
      if (quiz.timeFrameHandling === 'RESPECT_TIMEFRAME') {
        const now = new Date();
        const userTimeFrame = targetUser.timeFrame;

        if (!userTimeFrame || !userTimeFrame.from || !userTimeFrame.to) {
          console.log('❌ User has no time frame set');
          continue;
        }

        // Parse time frame
        const [fromHour, fromMinute] = userTimeFrame.from
          .split(':')
          .map(Number);
        const [toHour, toMinute] = userTimeFrame.to.split(':').map(Number);

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
          // Normal time frame (e.g., 09:00-17:00)
          isWithinTimeFrame = currentTime >= fromTime && currentTime <= toTime;
        } else {
          // Overnight time frame (e.g., 22:00-06:00)
          isWithinTimeFrame = currentTime >= fromTime || currentTime <= toTime;
        }

        if (!isWithinTimeFrame) {
          console.log(`❌ Quiz "${quiz.title}" blocked by time frame`);
          continue;
        } else {
          console.log(`✅ Quiz "${quiz.title}" is within time frame`);
        }
      } else if (quiz.timeFrameHandling === 'IGNORE_TIMEFRAME') {
        console.log(`✅ Quiz "${quiz.title}" ignores time frame`);
      }

      console.log(`🎯 QUIZ "${quiz.title}" SHOULD BE AVAILABLE!`);
      return quiz;
    }

    console.log(
      '\n❌ NO QUIZZES AVAILABLE - All blocked by time frame or inactive'
    );
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

testActualQuizEndpoint();
