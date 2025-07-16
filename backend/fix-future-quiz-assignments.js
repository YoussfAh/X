import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';

dotenv.config();

const fixFutureQuizAssignments = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const targetUserId = '6858740544e9650a43d091ad';

    // Find the user
    const user = await User.findById(targetUserId);
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log(`Checking user: ${user.name} (${user.email})`);
    console.log(`Current pending quizzes: ${user.pendingQuizzes.length}`);

    // Get all active TIME_INTERVAL quizzes
    const timeBasedQuizzes = await Quiz.find({
      isActive: true,
      triggerType: 'TIME_INTERVAL',
    });

    console.log(`Found ${timeBasedQuizzes.length} active time-based quizzes`);

    const now = new Date();
    let assignedCount = 0;

    for (const quiz of timeBasedQuizzes) {
      console.log(`\n--- Checking quiz: ${quiz.name} ---`);

      // Check if quiz is already assigned
      const existingAssignment = user.pendingQuizzes.find(
        (pendingQuiz) => pendingQuiz.quizId.toString() === quiz._id.toString()
      );

      if (existingAssignment) {
        console.log(`Quiz "${quiz.name}" already assigned to user`);
        continue;
      }

      // Check if user has already completed this quiz
      const completedQuiz = user.quizResults.find(
        (result) => result.quizId.toString() === quiz._id.toString()
      );

      if (completedQuiz) {
        console.log(`User has already completed quiz "${quiz.name}"`);
        continue;
      }

      // Check if quiz has been skipped
      const skippedQuiz = user.skippedQuizzes?.find(
        (skipped) => skipped.quizId.toString() === quiz._id.toString()
      );

      if (skippedQuiz) {
        console.log(`Quiz "${quiz.name}" was skipped for user`);
        continue;
      }

      // Calculate the reference date based on triggerStartFrom
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

      console.log(
        `Reference date (${
          quiz.triggerStartFrom || 'REGISTRATION'
        }): ${referenceDate}`
      );

      // Calculate delay amount in milliseconds
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
            delayMs = amount * 24 * 60 * 60 * 1000; // Default to days
            break;
        }
      }

      const triggerDate = new Date(referenceDate.getTime() + delayMs);
      console.log(`Trigger date: ${triggerDate}`);
      console.log(`Current time: ${now}`);
      console.log(
        `Time difference: ${(triggerDate - now) / (1000 * 60 * 60 * 24)} days`
      );

      // Check if it's time to assign this quiz
      if (now >= triggerDate) {
        console.log(`✅ Time to assign quiz "${quiz.name}"`);

        // Handle time frame based on the new timeFrameHandling field
        const timeFrameHandling = quiz.timeFrameHandling || 'RESPECT_TIMEFRAME';
        console.log(`Time frame handling: ${timeFrameHandling}`);

        let shouldAssign = true;

        switch (timeFrameHandling) {
          case 'RESPECT_TIMEFRAME':
            if (!user.timeFrame?.isWithinTimeFrame) {
              console.log(
                `❌ Skipping quiz "${quiz.name}" - user outside time frame`
              );
              shouldAssign = false;
            }
            break;
          case 'ALL_USERS':
            console.log(`✅ Quiz allows all users regardless of time frame`);
            break;
          case 'OUTSIDE_TIMEFRAME_ONLY':
            if (user.timeFrame?.isWithinTimeFrame) {
              console.log(
                `❌ Skipping quiz "${quiz.name}" - user within time frame, but quiz is for users outside time frame only`
              );
              shouldAssign = false;
            }
            break;
          default:
            // Fallback to legacy respectUserTimeFrame
            if (
              quiz.respectUserTimeFrame &&
              !user.timeFrame?.isWithinTimeFrame
            ) {
              console.log(
                `❌ Skipping quiz "${quiz.name}" - outside time frame (legacy setting)`
              );
              shouldAssign = false;
            }
            break;
        }

        if (shouldAssign) {
          // Find a system admin user for assignments
          const systemUser = await User.findOne({ isAdmin: true });

          // Assign the quiz
          user.pendingQuizzes.push({
            quizId: quiz._id,
            assignedAt: new Date(),
            assignedBy: systemUser._id,
            assignmentType: 'TIME_INTERVAL',
            scheduledFor: triggerDate,
            isAvailable: true,
          });

          assignedCount++;
          console.log(`✅ Assigned quiz "${quiz.name}" to user`);
        }
      } else {
        console.log(
          `⏰ Quiz "${quiz.name}" scheduled for future: ${triggerDate}`
        );
      }
    }

    if (assignedCount > 0) {
      await user.save();
      console.log(
        `\n🎉 Successfully assigned ${assignedCount} quizzes to user ${user.name}`
      );
    } else {
      console.log(`\nℹ️ No quizzes needed to be assigned to user ${user.name}`);
    }

    console.log(`\nFinal pending quizzes count: ${user.pendingQuizzes.length}`);
  } catch (error) {
    console.error('Error fixing future quiz assignments:', error);
  } finally {
    mongoose.connection.close();
  }
};

fixFutureQuizAssignments();
