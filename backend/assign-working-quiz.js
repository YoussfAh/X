import mongoose from 'mongoose';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function assignWorkingQuizToUser() {
  try {
    console.log('=== ASSIGNING WORKING QUIZ TO USER ===');

    // Get the user
    const targetUser = await User.findById('67f4139ef61083ea7f45e625');
    console.log(`User: ${targetUser.email}`);

    // Get the working quiz
    const workingQuiz = await Quiz.findOne({ name: 'Working Test Quiz' });
    if (!workingQuiz) {
      console.log('❌ Working test quiz not found!');
      return;
    }

    console.log(`Found quiz: "${workingQuiz.name}" (ID: ${workingQuiz._id})`);
    console.log(
      `Quiz details: ${workingQuiz.isActive ? 'Active' : 'Inactive'}, ${
        workingQuiz.triggerType
      }, ${workingQuiz.timeFrameHandling}`
    );

    // Create assignment object
    const assignment = {
      quizId: workingQuiz._id,
      assignedAt: new Date(),
      assignedBy: new mongoose.Types.ObjectId('67ed95c2f332cf5ccdd20eb4'), // Admin user
      assignmentType: 'ADMIN_MANUAL',
      isAvailable: true,
    };

    // Clear old assignments and add the new one
    await User.findByIdAndUpdate('67f4139ef61083ea7f45e625', {
      pendingQuizzes: [assignment],
    });

    console.log('✅ Quiz assigned to user successfully!');

    // Verify the assignment
    console.log('\n=== VERIFICATION ===');
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
      `User now has ${updatedUser.pendingQuizzes.length} pending quiz(s)`
    );

    for (const assignment of updatedUser.pendingQuizzes) {
      if (assignment.quizId) {
        console.log(
          `- "${assignment.quizId.name}" (${
            assignment.quizId.isActive ? 'Active' : 'Inactive'
          })`
        );
        console.log(
          `  Time Frame Handling: ${assignment.quizId.timeFrameHandling}`
        );
        console.log(`  Questions: ${assignment.quizId.questions?.length || 0}`);
      }
    }

    // Test the quiz availability logic
    console.log('\n=== TESTING QUIZ AVAILABILITY ===');

    const quiz = updatedUser.pendingQuizzes[0]?.quizId;
    if (quiz) {
      console.log(`Testing quiz: "${quiz.name}"`);

      if (!quiz.isActive) {
        console.log('❌ Quiz is not active');
      } else if (quiz.timeFrameHandling === 'ALL_USERS') {
        console.log(
          '🎯 QUIZ SHOULD BE AVAILABLE - Ignores time frame restrictions!'
        );
      } else if (quiz.timeFrameHandling === 'RESPECT_TIMEFRAME') {
        const userTimeFrame = updatedUser.timeFrame;
        if (!userTimeFrame || !userTimeFrame.from || !userTimeFrame.to) {
          console.log('❌ Quiz requires time frame but user has none set');
        } else {
          console.log(
            `User time frame: ${userTimeFrame.from} - ${userTimeFrame.to}`
          );
          console.log('⏰ Need to check if current time is within frame');
        }
      }
    }

    console.log('\n🚀 USER SHOULD NOW SEE QUIZ AT /quiz ENDPOINT!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

assignWorkingQuizToUser();
