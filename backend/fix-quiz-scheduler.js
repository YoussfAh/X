import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';

dotenv.config();

const fixAndImproveQuizScheduler = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all users with potential TIME_INTERVAL quizzes that should be assigned
    const users = await User.find({});
    console.log(
      `Checking ${users.length} users for missing quiz assignments...`
    );

    let totalFixed = 0;

    for (const user of users) {
      console.log(`\n--- Checking user: ${user.name} (${user.email}) ---`);

      // Get all active TIME_INTERVAL quizzes
      const timeBasedQuizzes = await Quiz.find({
        isActive: true,
        triggerType: 'TIME_INTERVAL',
      });

      let userFixed = 0;
      const now = new Date();

      for (const quiz of timeBasedQuizzes) {
        // Skip if already assigned, completed, or skipped
        const alreadyAssigned = user.pendingQuizzes.some(
          (pending) => pending.quizId.toString() === quiz._id.toString()
        );
        const alreadyCompleted = user.quizResults.some(
          (result) => result.quizId.toString() === quiz._id.toString()
        );
        const alreadySkipped = user.skippedQuizzes?.some(
          (skipped) => skipped.quizId.toString() === quiz._id.toString()
        );

        if (alreadyAssigned || alreadyCompleted || alreadySkipped) {
          continue;
        }

        // Calculate trigger date
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
        }

        const triggerDate = new Date(referenceDate.getTime() + delayMs);

        // Check if quiz should be assigned now
        if (now >= triggerDate) {
          // Check time frame restrictions
          const timeFrameHandling =
            quiz.timeFrameHandling || 'RESPECT_TIMEFRAME';
          let shouldAssign = true;

          switch (timeFrameHandling) {
            case 'RESPECT_TIMEFRAME':
              if (!user.timeFrame?.isWithinTimeFrame) {
                console.log(
                  `⚠️ Quiz "${quiz.name}" requires user to be within time frame, but user ${user.email} is outside time frame`
                );
                shouldAssign = false;
              }
              break;
            case 'ALL_USERS':
              // Allow all users
              break;
            case 'OUTSIDE_TIMEFRAME_ONLY':
              if (user.timeFrame?.isWithinTimeFrame) {
                console.log(
                  `⚠️ Quiz "${quiz.name}" is for users outside time frame only, but user ${user.email} is within time frame`
                );
                shouldAssign = false;
              }
              break;
            default:
              // Legacy handling
              if (
                quiz.respectUserTimeFrame &&
                !user.timeFrame?.isWithinTimeFrame
              ) {
                console.log(
                  `⚠️ Quiz "${quiz.name}" respects user time frame (legacy), but user ${user.email} is outside time frame`
                );
                shouldAssign = false;
              }
              break;
          }

          if (shouldAssign) {
            // Find a system admin user
            const systemUser = await User.findOne({ isAdmin: true });

            // Add the quiz to pending
            user.pendingQuizzes.push({
              quizId: quiz._id,
              assignedAt: new Date(),
              assignedBy: systemUser._id,
              assignmentType: 'TIME_INTERVAL',
              scheduledFor: triggerDate,
              isAvailable: true,
            });

            userFixed++;
            console.log(
              `✅ Fixed: Assigned quiz "${quiz.name}" to user ${user.email} (was due ${triggerDate})`
            );
          }
        }
      }

      if (userFixed > 0) {
        await user.save();
        totalFixed += userFixed;
        console.log(
          `💾 Saved ${userFixed} quiz assignments for user ${user.email}`
        );
      }
    }

    console.log(
      `\n🎉 Fixed ${totalFixed} missing quiz assignments across all users`
    );
  } catch (error) {
    console.error('Error fixing quiz scheduler:', error);
  } finally {
    mongoose.connection.close();
  }
};

fixAndImproveQuizScheduler();
