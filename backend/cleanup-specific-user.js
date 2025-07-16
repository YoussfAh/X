import dotenv from 'dotenv';
dotenv.config();
import connectDB from './config/db.js';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';

async function cleanupSpecificUser() {
  try {
    await connectDB();
    console.log('Connected to database');

    const userId = '6858740544e9650a43d091ad';

    const user = await User.findById(userId).populate({
      path: 'pendingQuizzes.quizId',
      model: 'Quiz',
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log(`User: ${user.email}`);
    console.log(`Original pending quizzes: ${user.pendingQuizzes.length}`);

    // Filter out null/orphaned quiz references
    const validQuizzes = user.pendingQuizzes.filter((pendingQuiz) => {
      if (!pendingQuiz.quizId) {
        console.log(`Removing orphaned quiz assignment: ${pendingQuiz.quizId}`);
        return false;
      }
      return true;
    });

    console.log(`Valid quizzes after cleanup: ${validQuizzes.length}`);

    // Update user with cleaned quiz assignments
    user.pendingQuizzes = validQuizzes;
    await user.save();

    console.log('✅ User cleanup completed');

    // Show remaining quizzes
    for (let i = 0; i < validQuizzes.length; i++) {
      const quiz = validQuizzes[i].quizId;
      console.log(
        `${i + 1}. "${quiz.name}" (${quiz._id}) - ${
          quiz.isActive ? 'Active' : 'Inactive'
        }`
      );
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupSpecificUser();
