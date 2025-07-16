import mongoose from 'mongoose';
import Quiz from './models/quizModel.js';
import User from './models/userModel.js';
import connectDB from './config/db.js';

async function testPendingQuizzes() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Get the test user
    const userId = '67f4139ef61083ea7f45e625';
    const user = await User.findById(userId);

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:', user.name, user.email);
    console.log('Current pending quizzes:', user.pendingQuizzes.length);

    // Find or create test quizzes
    const quizzes = await Quiz.find({ isActive: true }).limit(3);

    if (quizzes.length === 0) {
      console.log('No active quizzes found to assign');
      return;
    }

    // Get system admin for assignments
    const adminUser = await User.findOne({ isAdmin: true });
    if (!adminUser) {
      console.log('No admin user found');
      return;
    }

    console.log('\\nFound', quizzes.length, 'active quizzes');

    // Clear existing pending quizzes for clean test
    user.pendingQuizzes = [];

    // Add some test pending quiz assignments
    for (let i = 0; i < Math.min(3, quizzes.length); i++) {
      const quiz = quizzes[i];
      user.pendingQuizzes.push({
        quizId: quiz._id,
        assignedAt: new Date(),
        assignedBy: adminUser._id,
        assignmentType: 'ADMIN_MANUAL',
        isAvailable: true,
      });
      console.log(`Added pending quiz: ${quiz.name} (ID: ${quiz._id})`);
    }

    await user.save();

    console.log('\\n✅ Test setup complete!');
    console.log('User now has', user.pendingQuizzes.length, 'pending quiz(s)');
    console.log('\\nYou can now test:');
    console.log(
      '1. Go to: http://localhost:3000/admin/user/67f4139ef61083ea7f45e625/edit'
    );
    console.log('2. Open the "Pending Quizzes" section');
    console.log('3. Try removing individual quizzes using the trash button');
    console.log('4. Verify only the selected quiz is removed, not all quizzes');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testPendingQuizzes();
