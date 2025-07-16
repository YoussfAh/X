import dotenv from 'dotenv';
dotenv.config();
import connectDB from './config/db.js';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';

async function cleanupOrphanedQuizzes() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Get all users with pending quizzes
    const users = await User.find({ 'pendingQuizzes.0': { $exists: true } });

    console.log(`Found ${users.length} users with pending quizzes`);

    let totalCleaned = 0;

    for (const user of users) {
      console.log(`\nChecking user: ${user.email}`);
      console.log(`Original pending quizzes: ${user.pendingQuizzes.length}`);

      const validQuizzes = [];
      let cleanedCount = 0;

      for (const pendingQuiz of user.pendingQuizzes) {
        const quiz = await Quiz.findById(pendingQuiz.quizId);

        if (!quiz) {
          console.log(`  ❌ Removing orphaned quiz: ${pendingQuiz.quizId}`);
          cleanedCount++;
        } else if (!quiz.isActive) {
          console.log(`  ⚠️  Removing inactive quiz: ${quiz.name}`);
          cleanedCount++;
        } else {
          validQuizzes.push(pendingQuiz);
        }
      }

      if (cleanedCount > 0) {
        user.pendingQuizzes = validQuizzes;
        await user.save();
        totalCleaned += cleanedCount;
        console.log(`  ✅ Cleaned ${cleanedCount} invalid quizzes`);
        console.log(`  Remaining valid quizzes: ${validQuizzes.length}`);
      } else {
        console.log(`  ✅ All quizzes are valid`);
      }
    }

    console.log(`\n=== Cleanup Summary ===`);
    console.log(`Total orphaned/inactive quizzes cleaned: ${totalCleaned}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupOrphanedQuizzes();
