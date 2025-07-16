import mongoose from 'mongoose';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function cleanOrphanedQuizReferences() {
  try {
    console.log('=== CLEANING ORPHANED QUIZ REFERENCES ===');

    // Get target user
    const targetUser = await User.findById('67f4139ef61083ea7f45e625');
    console.log(`User: ${targetUser.email}`);
    console.log(`Current pending quizzes: ${targetUser.pendingQuizzes.length}`);

    // Check each quiz reference and remove orphaned ones
    const validQuizzes = [];
    const orphanedQuizzes = [];

    for (const assignment of targetUser.pendingQuizzes) {
      const quizId = assignment.quizId;
      const quiz = await Quiz.findById(quizId);

      if (quiz) {
        console.log(`✅ Valid quiz: "${quiz.title}" (${quiz.status})`);
        validQuizzes.push(assignment);
      } else {
        console.log(`❌ Orphaned quiz reference: ${quizId}`);
        orphanedQuizzes.push(assignment);
      }
    }

    console.log(
      `\nFound ${validQuizzes.length} valid quizzes, ${orphanedQuizzes.length} orphaned references`
    );

    // Update user with only valid quiz references
    await User.findByIdAndUpdate('67f4139ef61083ea7f45e625', {
      pendingQuizzes: validQuizzes,
    });

    console.log(
      `✅ User updated - removed ${orphanedQuizzes.length} orphaned references`
    );

    // Check what quizzes actually exist in the system
    console.log('\n=== CHECKING ALL QUIZZES IN SYSTEM ===');
    const allQuizzes = await Quiz.find().select(
      'title status trigger timeFrameHandling'
    );
    console.log(`Total quizzes in system: ${allQuizzes.length}`);

    if (allQuizzes.length === 0) {
      console.log('❌ NO QUIZZES EXIST IN THE SYSTEM!');
      console.log('This is why users see no quizzes at /quiz');
    } else {
      allQuizzes.forEach((quiz) => {
        console.log(
          `- "${quiz.title}" (Status: ${quiz.status}, Trigger: ${quiz.trigger})`
        );
      });

      // Check specifically for active quizzes
      const activeQuizzes = allQuizzes.filter((q) => q.status === 'active');
      console.log(`\nActive quizzes: ${activeQuizzes.length}`);

      if (activeQuizzes.length === 0) {
        console.log('❌ NO ACTIVE QUIZZES - Users will see empty quiz list');
      }
    }

    // Final verification
    console.log('\n=== FINAL USER STATE ===');
    const updatedUser = await User.findById(
      '67f4139ef61083ea7f45e625'
    ).populate({
      path: 'pendingQuizzes',
      populate: {
        path: 'quizId',
        model: 'Quiz',
      },
    });

    console.log(
      `Final pending quizzes count: ${updatedUser.pendingQuizzes.length}`
    );

    if (updatedUser.pendingQuizzes.length === 0) {
      console.log('✅ User now has clean state with no orphaned references');
      console.log(
        '❗ User needs valid active quiz assignments to see quizzes at /quiz'
      );
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

cleanOrphanedQuizReferences();
