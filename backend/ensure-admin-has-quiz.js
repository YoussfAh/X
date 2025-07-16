import mongoose from 'mongoose';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function ensureAdminHasQuiz() {
  try {
    console.log('🔧 Ensuring admin user has a quiz assigned...\n');

    const adminUser = await User.findOne({ email: 'admin@email.com' });
    const fitnessQuiz = await Quiz.findOne({ name: 'Fitness Assessment Quiz' });

    if (!adminUser || !fitnessQuiz) {
      console.log('❌ Admin user or Fitness Assessment Quiz not found');
      return;
    }

    // Assign fitness quiz to admin
    const assignment = {
      quizId: fitnessQuiz._id,
      assignedAt: new Date(),
      assignedBy: adminUser._id,
      assignmentType: 'ADMIN_MANUAL',
      isAvailable: true,
    };

    await User.findByIdAndUpdate(adminUser._id, {
      pendingQuizzes: [assignment],
    });

    console.log('✅ Admin user now has Fitness Assessment Quiz assigned');
    console.log('🎯 Admin can now test at: http://localhost:3000/quiz');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

ensureAdminHasQuiz();
