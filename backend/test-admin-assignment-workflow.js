import mongoose from 'mongoose';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testAdminAssignmentWorkflow() {
  try {
    console.log('=== TESTING ADMIN ASSIGNMENT WORKFLOW ===\n');

    // 1. Get available quizzes for assignment
    const availableQuizzes = await Quiz.find({ isActive: true });
    console.log('📝 Available quizzes for assignment:');
    availableQuizzes.forEach((quiz, index) => {
      console.log(`  ${index + 1}. "${quiz.name}" (${quiz.timeFrameHandling})`);
    });

    // 2. Get target user (the one we've been working with)
    const targetUser = await User.findById('67f4139ef61083ea7f45e625');
    console.log(
      `\n👤 Target User: ${targetUser.email} (ID: ${targetUser._id})`
    );

    // 3. Simulate admin assigning the "Nutrition Preferences Quiz"
    const nutritionQuiz = availableQuizzes.find(
      (q) => q.name === 'Nutrition Preferences Quiz'
    );
    if (!nutritionQuiz) {
      console.log('❌ Nutrition Preferences Quiz not found!');
      return;
    }

    console.log(`\n🎯 Simulating admin assignment...`);
    console.log(`   Quiz: "${nutritionQuiz.name}"`);
    console.log(`   Target User: ${targetUser.email}`);
    console.log(`   Admin User: admin@email.com`);

    // 4. Create assignment (simulating what admin panel does)
    const adminUser = await User.findOne({ email: 'admin@email.com' });
    const assignment = {
      quizId: nutritionQuiz._id,
      assignedAt: new Date(),
      assignedBy: adminUser._id,
      assignmentType: 'ADMIN_MANUAL',
      isAvailable: true,
    };

    // Add to user's pending quizzes (not replacing, just adding)
    await User.findByIdAndUpdate(targetUser._id, {
      $push: { pendingQuizzes: assignment },
    });

    console.log(`✅ Assignment completed!`);

    // 5. Verify what user would see at /quiz endpoint
    console.log(`\n🔍 Checking what user sees at /quiz endpoint...`);

    const updatedUser = await User.findById(targetUser._id).populate({
      path: 'pendingQuizzes.quizId',
      model: 'Quiz',
    });

    console.log(
      `User now has ${updatedUser.pendingQuizzes.length} pending quiz(s):`
    );

    let availableQuizForUser = null;
    for (const [
      index,
      pendingAssignment,
    ] of updatedUser.pendingQuizzes.entries()) {
      const quiz = pendingAssignment.quizId;
      if (quiz) {
        console.log(`  ${index + 1}. "${quiz.name}"`);
        console.log(`     Status: ${quiz.isActive ? 'Active' : 'Inactive'}`);
        console.log(`     Time Frame: ${quiz.timeFrameHandling}`);
        console.log(
          `     Assigned: ${pendingAssignment.assignedAt.toLocaleString()}`
        );

        // Check if this quiz would be available
        if (quiz.isActive && quiz.timeFrameHandling === 'ALL_USERS') {
          if (!availableQuizForUser) {
            availableQuizForUser = quiz;
            console.log(`     🎯 FIRST AVAILABLE - This will show at /quiz`);
          } else {
            console.log(`     ✅ Also available`);
          }
        } else {
          console.log(`     ❌ May be blocked`);
        }
      } else {
        console.log(`  ${index + 1}. ❌ Orphaned reference`);
      }
    }

    // 6. Summary
    console.log(`\n=== ASSIGNMENT TEST RESULTS ===`);
    if (availableQuizForUser) {
      console.log(
        `✅ SUCCESS: User will see "${availableQuizForUser.name}" at /quiz`
      );
      console.log(
        `   Questions: ${availableQuizForUser.questions?.length || 0}`
      );
      console.log(`   Message: ${availableQuizForUser.homePageMessage}`);
    } else {
      console.log(`❌ ISSUE: No quizzes available for user`);
    }

    console.log(`\n📋 Next Steps:`);
    console.log(
      `1. Visit admin panel: http://localhost:3000/admin/user/${targetUser._id}/edit`
    );
    console.log(
      `2. Verify ${updatedUser.pendingQuizzes.length} pending quizzes are shown`
    );
    console.log(
      `3. Visit user quiz page: http://localhost:3000/quiz (when logged in as ${targetUser.email})`
    );
    console.log(
      `4. Should see: "${availableQuizForUser?.name || 'No quiz available'}"`
    );

    console.log(`\n🔄 Cache Refresh:`);
    console.log(
      `   RTK Query will invalidate 'ActiveQuiz' cache when assignments are made`
    );
    console.log(`   Frontend should automatically refresh quiz data`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

testAdminAssignmentWorkflow();
