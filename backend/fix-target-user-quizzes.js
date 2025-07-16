import mongoose from 'mongoose';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixTargetUserQuizzes() {
  try {
    console.log('=== Fixing Target User Quiz Issues ===');

    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URI ||
        'mongodb+srv://pro-g:prog123@cluster0.a7kzq.mongodb.net/pro_g?retryWrites=true&w=majority&appName=Cluster0'
    );
    console.log('Connected to MongoDB');

    // Target user ID from admin panel
    const targetUserId = '67f4139ef61083ea7f45e625';

    // Find target user
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      console.log('❌ Target user not found');
      return;
    }

    console.log(`\n👤 Target User: ${targetUser.email}`);
    console.log(`Current TimeFrame: ${targetUser.timeFrame || 'NONE'}`);

    // Fix 1: Ensure user has a timeframe if needed
    if (!targetUser.timeFrame) {
      targetUser.timeFrame = 'BEGINNER'; // Set a default timeframe
      await targetUser.save();
      console.log('✅ Set user timeframe to BEGINNER');
    }

    // Fix 2: Find and fix the assigned quizzes with no questions
    const quizIds = targetUser.pendingQuizzes.map((p) => p.quizId);
    const assignedQuizzes = await Quiz.find({ _id: { $in: quizIds } });

    console.log(`\n📝 Fixing ${assignedQuizzes.length} assigned quizzes:`);

    for (const quiz of assignedQuizzes) {
      console.log(`\n--- Fixing Quiz: ${quiz.name} ---`);

      let needsUpdate = false;

      // Fix questions if empty
      if (!quiz.questions || quiz.questions.length === 0) {
        console.log('❌ Quiz has no questions, adding sample questions...');

        quiz.questions = [
          {
            questionText: `Sample question 1 for ${quiz.name}`,
            type: 'multiple-choice',
            options: [
              { text: 'Option A', isCorrect: true },
              { text: 'Option B', isCorrect: false },
              { text: 'Option C', isCorrect: false },
            ],
          },
          {
            questionText: `Sample question 2 for ${quiz.name}`,
            type: 'true-false',
            options: [
              { text: 'Yes', isCorrect: true },
              { text: 'No', isCorrect: false },
            ],
          },
        ];
        needsUpdate = true;
      }

      // Fix timeframe handling for better compatibility
      if (quiz.timeFrameHandling === 'RESPECT_TIMEFRAME') {
        console.log(
          '🔄 Changing timeFrameHandling to ALL_USERS for better compatibility...'
        );
        quiz.timeFrameHandling = 'ALL_USERS';
        needsUpdate = true;
      }

      // Ensure quiz is active
      if (!quiz.isActive) {
        console.log('🔄 Making quiz active...');
        quiz.isActive = true;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await quiz.save();
        console.log(`✅ Updated quiz: ${quiz.name}`);
        console.log(`   Questions: ${quiz.questions.length}`);
        console.log(`   TimeFrame: ${quiz.timeFrameHandling}`);
        console.log(`   Status: ${quiz.isActive ? 'Active' : 'Inactive'}`);
      } else {
        console.log(`✅ Quiz "${quiz.name}" is already properly configured`);
      }
    }

    // Fix 3: Test the result
    console.log('\n🧪 Testing after fixes...');

    const updatedUser = await User.findById(targetUserId).populate({
      path: 'pendingQuizzes.quizId',
      model: 'Quiz',
    });

    const validPendingQuizzes = updatedUser.pendingQuizzes.filter(
      (pending) => pending.quizId
    );

    if (validPendingQuizzes.length > 0) {
      const firstQuiz = validPendingQuizzes[0].quizId;
      console.log(`\n🎯 First available quiz for user: "${firstQuiz.name}"`);
      console.log(`   Questions: ${firstQuiz.questions.length}`);
      console.log(`   TimeFrame: ${firstQuiz.timeFrameHandling}`);
      console.log(`   User's TimeFrame: ${updatedUser.timeFrame}`);

      // Check if it would be eligible
      const isEligible =
        firstQuiz.isActive &&
        (firstQuiz.timeFrameHandling === 'ALL_USERS' ||
          (firstQuiz.timeFrameHandling === 'RESPECT_TIMEFRAME' &&
            updatedUser.timeFrame));

      console.log(`   Eligible: ${isEligible ? '✅ YES' : '❌ NO'}`);
    }

    console.log(`\n🔐 User can now login and access quizzes at:`);
    console.log(`   Login: ${updatedUser.email}`);
    console.log(`   URL: http://localhost:3000/quiz`);
    console.log(
      `   Expected: Should see "${
        validPendingQuizzes[0]?.quizId?.name || 'No quiz'
      }"`
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔐 Disconnected from MongoDB');
  }
}

fixTargetUserQuizzes();
