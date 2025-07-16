import mongoose from 'mongoose';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkWhoIsLoggedInAndFixQuizzes() {
  try {
    console.log('=== CHECKING CURRENT USER LOGIN STATE ===');

    // Check admin user (the one currently logged in)
    const adminUser = await User.findOne({ email: 'admin@email.com' }).populate(
      {
        path: 'pendingQuizzes.quizId',
        model: 'Quiz',
      }
    );

    console.log(`\nADMIN USER: ${adminUser.email}`);
    console.log(
      `Admin Time Frame: ${adminUser.timeFrame?.from || 'Not set'} - ${
        adminUser.timeFrame?.to || 'Not set'
      }`
    );
    console.log(`Admin Pending Quizzes: ${adminUser.pendingQuizzes.length}`);

    // Check the target user we've been working on
    const targetUser = await User.findById('67f4139ef61083ea7f45e625').populate(
      {
        path: 'pendingQuizzes.quizId',
        model: 'Quiz',
      }
    );

    console.log(`\nTARGET USER: ${targetUser.email}`);
    console.log(
      `Target Time Frame: ${targetUser.timeFrame?.from || 'Not set'} - ${
        targetUser.timeFrame?.to || 'Not set'
      }`
    );
    console.log(`Target Pending Quizzes: ${targetUser.pendingQuizzes.length}`);

    console.log('\n=== SOLUTION: ASSIGN QUIZ TO ADMIN USER ===');

    // Get the working test quiz
    const workingQuiz = await Quiz.findOne({ name: 'Working Test Quiz' });
    if (!workingQuiz) {
      console.log('❌ Working test quiz not found!');
      return;
    }

    // Clear admin's pending quizzes and assign the working quiz
    const assignment = {
      quizId: workingQuiz._id,
      assignedAt: new Date(),
      assignedBy: adminUser._id,
      assignmentType: 'ADMIN_MANUAL',
      isAvailable: true,
    };

    await User.findOneAndUpdate(
      { email: 'admin@email.com' },
      { pendingQuizzes: [assignment] }
    );

    console.log(
      `✅ Assigned "Working Test Quiz" to admin user (${adminUser.email})`
    );
    console.log(
      `   This quiz uses "ALL_USERS" time frame handling - will always be available`
    );

    // Test admin quiz availability
    console.log('\n=== TESTING ADMIN QUIZ AVAILABILITY ===');

    const now = new Date();
    console.log(
      `Current time: ${now.getHours()}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`
    );
    console.log(`Quiz: "${workingQuiz.name}"`);
    console.log(`Time Frame Handling: ${workingQuiz.timeFrameHandling}`);
    console.log(`Status: ${workingQuiz.isActive ? 'Active' : 'Inactive'}`);
    console.log(`Questions: ${workingQuiz.questions?.length || 0}`);

    if (workingQuiz.isActive && workingQuiz.timeFrameHandling === 'ALL_USERS') {
      console.log('\n🎯 ADMIN USER SHOULD NOW SEE QUIZ AT /quiz ENDPOINT!');
    }

    console.log('\n📋 VERIFICATION STEPS:');
    console.log('1. Visit http://localhost:3000/quiz (as admin@email.com)');
    console.log('2. You should see "Working Test Quiz" with 2 questions');
    console.log('3. The quiz ignores time frame restrictions');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkWhoIsLoggedInAndFixQuizzes();
