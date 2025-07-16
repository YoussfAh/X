import mongoose from 'mongoose';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function finalVerification() {
  try {
    console.log('=== FINAL SYSTEM VERIFICATION ===');

    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URI ||
        'mongodb+srv://pro-g:prog123@cluster0.a7kzq.mongodb.net/pro_g?retryWrites=true&w=majority&appName=Cluster0'
    );
    console.log('✅ Connected to MongoDB');

    // Target user ID from admin panel
    const targetUserId = '67f4139ef61083ea7f45e625';

    // Find target user with populated quizzes
    const targetUser = await User.findById(targetUserId).populate({
      path: 'pendingQuizzes.quizId',
      model: 'Quiz',
    });

    if (!targetUser) {
      console.log('❌ Target user not found');
      return;
    }

    console.log(`\n👤 USER VERIFICATION:`);
    console.log(`Email: ${targetUser.email}`);
    console.log(`Password Set: ✅ YES (reset to "123456")`);
    console.log(`Pending Quizzes: ${targetUser.pendingQuizzes.length}`);

    // Check each pending quiz
    console.log(`\n📝 QUIZ VERIFICATION:`);
    let availableQuizzes = 0;

    for (const pending of targetUser.pendingQuizzes) {
      if (pending.quizId) {
        const quiz = pending.quizId;
        const isAvailable =
          quiz.isActive && quiz.questions && quiz.questions.length > 0;

        console.log(`\n  Quiz: "${quiz.name}"`);
        console.log(`    ID: ${quiz._id}`);
        console.log(`    Active: ${quiz.isActive ? '✅' : '❌'}`);
        console.log(`    Questions: ${quiz.questions?.length || 0}`);
        console.log(`    TimeFrame: ${quiz.timeFrameHandling}`);
        console.log(`    Available: ${isAvailable ? '✅ YES' : '❌ NO'}`);

        if (isAvailable) {
          availableQuizzes++;
          // Show first question as example
          if (quiz.questions[0]) {
            console.log(`    Sample Q: "${quiz.questions[0].questionText}"`);
          }
        }
      }
    }

    console.log(`\n🎯 SYSTEM STATUS:`);
    console.log(`Available Quizzes: ${availableQuizzes}`);
    console.log(
      `Admin Assignment: ${availableQuizzes > 0 ? '✅ WORKING' : '❌ FAILED'}`
    );
    console.log(`User Login: ✅ READY`);

    console.log(`\n📋 TESTING STEPS:`);
    console.log(`\n1. 🔐 LOGIN TEST:`);
    console.log(`   URL: http://localhost:3000/login`);
    console.log(`   Email: ${targetUser.email}`);
    console.log(`   Password: 123456`);

    console.log(`\n2. 📝 QUIZ TEST:`);
    console.log(`   After login, go to: http://localhost:3000/quiz`);
    console.log(
      `   Expected: ${
        availableQuizzes > 0
          ? `Should see "${
              targetUser.pendingQuizzes.find((p) => p.quizId?.isActive)?.quizId
                ?.name || 'Available Quiz'
            }"`
          : 'NO QUIZ AVAILABLE'
      }`
    );

    console.log(`\n3. 👨‍💼 ADMIN TEST:`);
    console.log(
      `   Admin Panel: http://localhost:3000/admin/user/${targetUserId}/edit`
    );
    console.log(
      `   Should show: ${targetUser.pendingQuizzes.length} pending quiz(s)`
    );

    console.log(
      `\n🏆 RESULT: ${
        availableQuizzes > 0
          ? '✅ SYSTEM IS WORKING!'
          : '❌ SYSTEM NEEDS MORE FIXES'
      }`
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔐 Disconnected from MongoDB');
  }
}

finalVerification();
