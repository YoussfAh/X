import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';

dotenv.config();

const debugQuizSystem = async () => {
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

    console.log(`=== User: ${user.name} (${user.email}) ===`);
    console.log(`User created at: ${user.createdAt}`);
    console.log(`User time frame:`, user.timeFrame);
    console.log(`Pending quizzes: ${user.pendingQuizzes.length}`);
    console.log(`Completed quizzes: ${user.quizResults.length}`);
    console.log(`Skipped quizzes: ${user.skippedQuizzes?.length || 0}`);

    // Show current pending quizzes
    console.log('\n=== Current Pending Quizzes ===');
    for (const pendingQuiz of user.pendingQuizzes) {
      const quiz = await Quiz.findById(pendingQuiz.quizId);
      console.log(`- ${quiz?.name || 'Unknown'} (${pendingQuiz.quizId})`);
      console.log(`  Assigned: ${pendingQuiz.assignedAt}`);
      console.log(`  Type: ${pendingQuiz.assignmentType}`);
      console.log(`  Scheduled for: ${pendingQuiz.scheduledFor || 'N/A'}`);
      console.log(`  Available: ${pendingQuiz.isAvailable}`);
    }

    // Show completed quizzes
    console.log('\n=== Completed Quizzes ===');
    for (const result of user.quizResults) {
      console.log(`- ${result.quizName} (${result.quizId})`);
      console.log(`  Completed: ${result.submittedAt}`);
    }

    // Show skipped quizzes
    console.log('\n=== Skipped Quizzes ===');
    if (user.skippedQuizzes && user.skippedQuizzes.length > 0) {
      for (const skipped of user.skippedQuizzes) {
        const quiz = await Quiz.findById(skipped.quizId);
        console.log(`- ${quiz?.name || 'Unknown'} (${skipped.quizId})`);
        console.log(`  Skipped: ${skipped.skippedAt}`);
        console.log(`  Reason: ${skipped.reason}`);
      }
    } else {
      console.log('No skipped quizzes');
    }

    // Get all TIME_INTERVAL quizzes
    console.log('\n=== All TIME_INTERVAL Quizzes ===');
    const timeBasedQuizzes = await Quiz.find({
      triggerType: 'TIME_INTERVAL',
    });

    for (const quiz of timeBasedQuizzes) {
      console.log(`\n--- Quiz: ${quiz.name} ---`);
      console.log(`ID: ${quiz._id}`);
      console.log(`Active: ${quiz.isActive}`);
      console.log(
        `Trigger delay: ${
          quiz.triggerDelayAmount || quiz.triggerDelayDays || 0
        } ${quiz.triggerDelayUnit || 'days'}`
      );
      console.log(
        `Trigger start from: ${quiz.triggerStartFrom || 'REGISTRATION'}`
      );
      console.log(
        `Time frame handling: ${quiz.timeFrameHandling || 'RESPECT_TIMEFRAME'}`
      );
      console.log(
        `Respect user time frame (legacy): ${quiz.respectUserTimeFrame}`
      );
      console.log(`Questions: ${quiz.questions?.length || 0}`);

      // Calculate when this quiz should be triggered for this user
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
      const now = new Date();

      console.log(`Reference date: ${referenceDate}`);
      console.log(`Trigger date: ${triggerDate}`);
      console.log(
        `Days until trigger: ${(
          (triggerDate - now) /
          (1000 * 60 * 60 * 24)
        ).toFixed(1)}`
      );

      // Check status for this user
      const isAssigned = user.pendingQuizzes.some(
        (p) => p.quizId.toString() === quiz._id.toString()
      );
      const isCompleted = user.quizResults.some(
        (r) => r.quizId.toString() === quiz._id.toString()
      );
      const isSkipped =
        user.skippedQuizzes?.some(
          (s) => s.quizId.toString() === quiz._id.toString()
        ) || false;

      console.log(`Status for this user:`);
      console.log(`  - Assigned: ${isAssigned}`);
      console.log(`  - Completed: ${isCompleted}`);
      console.log(`  - Skipped: ${isSkipped}`);
      console.log(
        `  - Should be available now: ${now >= triggerDate && quiz.isActive}`
      );
    }
  } catch (error) {
    console.error('Error debugging quiz system:', error);
  } finally {
    mongoose.connection.close();
  }
};

debugQuizSystem();
