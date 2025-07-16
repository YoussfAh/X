import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { autoAssignQuizzes } from './controllers/quizController.js';

dotenv.config();

const manualTriggerScheduler = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    console.log('🚀 Manually triggering auto-assignment scheduler...');

    // Run the auto-assignment function
    const result = await autoAssignQuizzes();

    console.log('✅ Auto-assignment completed:', result);
  } catch (error) {
    console.error('❌ Error running auto-assignment:', error);
  } finally {
    mongoose.connection.close();
  }
};

manualTriggerScheduler();
