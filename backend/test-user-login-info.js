import mongoose from 'mongoose';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testTargetUserLogin() {
  try {
    console.log('=== Testing Target User Login Credentials ===');

    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URI ||
        'mongodb+srv://pro-g:prog123@cluster0.a7kzq.mongodb.net/pro_g?retryWrites=true&w=majority&appName=Cluster0'
    );
    console.log('Connected to MongoDB');

    // Target user ID from admin panel
    const targetUserId = '67f4139ef61083ea7f45e625';

    // Find target user
    const targetUser = await User.findById(targetUserId).populate({
      path: 'pendingQuizzes.quizId',
      model: 'Quiz',
    });

    if (!targetUser) {
      console.log('❌ Target user not found');
      return;
    }

    console.log(`\n👤 Target User Details:`);
    console.log(`Email: ${targetUser.email}`);
    console.log(`ID: ${targetUser._id}`);
    console.log(`Is Admin: ${targetUser.isAdmin}`);
    console.log(`Created: ${targetUser.createdAt}`);

    // Check if user has a password set
    if (targetUser.password) {
      console.log(`Password: Set (${targetUser.password.length} chars)`);

      // Test common passwords
      const commonPasswords = [
        '123456',
        'password',
        'test123',
        'admin123',
        '123456@email.com',
      ];

      console.log(`\n🔐 Testing common passwords...`);

      for (const testPassword of commonPasswords) {
        const isMatch = await bcrypt.compare(testPassword, targetUser.password);
        if (isMatch) {
          console.log(`✅ Password found: "${testPassword}"`);
          break;
        } else {
          console.log(`❌ Not: "${testPassword}"`);
        }
      }
    } else {
      console.log(`❌ No password set for user`);
    }

    // Show pending quizzes
    console.log(
      `\n📝 Current Pending Quizzes: ${targetUser.pendingQuizzes.length}`
    );

    let hasEligibleQuiz = false;
    for (const pending of targetUser.pendingQuizzes) {
      if (pending.quizId) {
        console.log(
          `  ✅ "${pending.quizId.name}" (${
            pending.quizId.questions?.length || 0
          } questions)`
        );
        if (pending.quizId.isActive && pending.quizId.questions?.length > 0) {
          hasEligibleQuiz = true;
        }
      } else {
        console.log(`  ❌ Orphaned quiz assignment`);
      }
    }

    console.log(`\n🎯 Summary:`);
    console.log(`Login Email: ${targetUser.email}`);
    console.log(`Has Quiz Available: ${hasEligibleQuiz ? '✅ YES' : '❌ NO'}`);
    console.log(`\n📋 Instructions:`);
    console.log(`1. Go to: http://localhost:3000/login`);
    console.log(`2. Login with: ${targetUser.email}`);
    console.log(`3. Use password: [try common passwords above]`);
    console.log(`4. After login, go to: http://localhost:3000/quiz`);
    console.log(`5. You should see an available quiz`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔐 Disconnected from MongoDB');
  }
}

testTargetUserLogin();
