import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';

dotenv.config();

const createImprovedScheduler = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    console.log('Creating improved quiz scheduler function...');

    // This is an improved version of the autoAssignQuizzes function
    const improvedAutoAssignQuizzes = async () => {
      console.log(
        '--- Starting improved automatic quiz assignment process ---'
      );

      try {
        // Find a system admin user for assignments
        const systemUser = await User.findOne({ isAdmin: true });
        if (!systemUser) {
          throw new Error('No admin user found for system assignments');
        }

        // Get all active time-based quizzes
        const timeBasedQuizzes = await Quiz.find({
          isActive: true,
          triggerType: 'TIME_INTERVAL',
        });

        if (timeBasedQuizzes.length === 0) {
          console.log('No active time-based quizzes found.');
          return {
            message: 'No time-based quizzes to assign',
            assignedCount: 0,
          };
        }

        console.log(
          `Found ${timeBasedQuizzes.length} active time-based quizzes`
        );

        // Get all users
        const users = await User.find({});
        let totalAssigned = 0;
        const assignmentLog = [];

        for (const user of users) {
          const now = new Date();

          for (const quiz of timeBasedQuizzes) {
            // Check if already assigned
            const existingAssignment = user.pendingQuizzes.find(
              (pendingQuiz) =>
                pendingQuiz.quizId.toString() === quiz._id.toString()
            );

            if (existingAssignment) {
              // Double-check if the existing assignment needs to be updated
              if (
                !existingAssignment.scheduledFor ||
                !existingAssignment.isAvailable
              ) {
                console.log(
                  `Updating existing assignment for quiz "${quiz.name}" for user "${user.email}"`
                );
                existingAssignment.isAvailable = true;
                if (!existingAssignment.scheduledFor) {
                  existingAssignment.scheduledFor =
                    existingAssignment.assignedAt;
                }
                await user.save();
              }
              continue;
            }

            // Check if already completed
            const completedQuiz = user.quizResults.find(
              (result) => result.quizId.toString() === quiz._id.toString()
            );

            if (completedQuiz) {
              continue;
            }

            // Check if skipped
            const skippedQuiz = user.skippedQuizzes?.find(
              (skipped) => skipped.quizId.toString() === quiz._id.toString()
            );

            if (skippedQuiz) {
              continue;
            }

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
            const amount =
              quiz.triggerDelayAmount || quiz.triggerDelayDays || 0;
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

            // Check if it's time to assign
            if (now >= triggerDate) {
              // Handle time frame restrictions
              const timeFrameHandling =
                quiz.timeFrameHandling || 'RESPECT_TIMEFRAME';
              let shouldAssign = true;

              switch (timeFrameHandling) {
                case 'RESPECT_TIMEFRAME':
                  if (!user.timeFrame?.isWithinTimeFrame) {
                    console.log(
                      `Skipping quiz "${quiz.name}" for user "${user.email}" - outside time frame`
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
                      `Skipping quiz "${quiz.name}" for user "${user.email}" - within time frame, but quiz is for users outside time frame only`
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
                      `Skipping quiz "${quiz.name}" for user "${user.email}" - outside time frame (legacy setting)`
                    );
                    shouldAssign = false;
                  }
                  break;
              }

              if (shouldAssign) {
                // Assign the quiz
                user.pendingQuizzes.push({
                  quizId: quiz._id,
                  assignedAt: new Date(),
                  assignedBy: systemUser._id,
                  assignmentType: 'TIME_INTERVAL',
                  scheduledFor: triggerDate,
                  isAvailable: true,
                });

                await user.save();
                totalAssigned++;

                const logEntry = {
                  user: user.email,
                  quiz: quiz.name,
                  triggerDate: triggerDate,
                  assignedAt: new Date(),
                  referenceDate: referenceDate,
                  delay: `${amount} ${unit}`,
                };
                assignmentLog.push(logEntry);

                console.log(
                  `✅ Assigned quiz "${quiz.name}" to user "${user.email}" (was due ${triggerDate})`
                );
              }
            } else {
              // Log future assignments for debugging
              const daysUntil = Math.ceil(
                (triggerDate - now) / (1000 * 60 * 60 * 24)
              );
              if (daysUntil <= 7) {
                // Only log assignments due within a week
                console.log(
                  `⏰ Quiz "${quiz.name}" for user "${user.email}" due in ${daysUntil} days (${triggerDate})`
                );
              }
            }
          }
        }

        console.log(
          `--- Auto-assignment completed. Total assigned: ${totalAssigned} ---`
        );

        if (assignmentLog.length > 0) {
          console.log('\n📋 Assignment Details:');
          assignmentLog.forEach((log) => {
            console.log(
              `  • ${log.user}: ${log.quiz} (${log.delay} after ${log.referenceDate})`
            );
          });
        }

        return { assignedCount: totalAssigned, assignments: assignmentLog };
      } catch (error) {
        console.error(`[CRITICAL] Auto-assignment failed: ${error.message}`);
        throw error;
      }
    };

    // Run the improved scheduler once
    const result = await improvedAutoAssignQuizzes();
    console.log('\n🎉 Improved scheduler test completed:', result);

    // Test the specific user
    const targetUserId = '6858740544e9650a43d091ad';
    const user = await User.findById(targetUserId);

    if (user) {
      console.log('\n=== Post-Fix Status for Target User ===');
      console.log(`User: ${user.name} (${user.email})`);
      console.log(`Pending quizzes: ${user.pendingQuizzes.length}`);

      for (const pendingQuiz of user.pendingQuizzes) {
        const quiz = await Quiz.findById(pendingQuiz.quizId);
        console.log(`- ${quiz?.name || 'Unknown'}`);
        console.log(`  Scheduled: ${pendingQuiz.scheduledFor}`);
        console.log(`  Available: ${pendingQuiz.isAvailable}`);
        console.log(`  Type: ${pendingQuiz.assignmentType}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
};

createImprovedScheduler();
