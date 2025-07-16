// Debug script to check user time frame and fix quiz assignment issue
import mongoose from 'mongoose';
import User from './backend/models/userModel.js';
import Quiz from './backend/models/quizModel.js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const debugUserTimeFrame = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const userId = '67f4139ef61083ea7f45e625';
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log(`\n=== USER TIME FRAME DEBUG ===`);
    console.log(`User: ${user.email}`);
    console.log(`Current time frame:`, {
      startDate: user.timeFrame.startDate,
      duration: user.timeFrame.duration,
      durationType: user.timeFrame.durationType,
      endDate: user.timeFrame.endDate,
      isWithinTimeFrame: user.timeFrame.isWithinTimeFrame,
      timeFrameSetAt: user.timeFrame.timeFrameSetAt,
      timeFrameSetBy: user.timeFrame.timeFrameSetBy
    });

    console.log(`\n=== UPDATING TIME FRAME STATUS ===`);
    const wasWithinTimeFrame = user.timeFrame.isWithinTimeFrame;
    const updatedStatus = user.updateTimeFrameStatus();
    console.log(`Previous status: ${wasWithinTimeFrame}`);
    console.log(`Updated status: ${updatedStatus}`);
    console.log(`Current date: ${new Date()}`);
    
    if (user.timeFrame.startDate && user.timeFrame.endDate) {
      console.log(`Start date: ${user.timeFrame.startDate}`);
      console.log(`End date: ${user.timeFrame.endDate}`);
      console.log(`Is current date >= start date: ${new Date() >= user.timeFrame.startDate}`);
      console.log(`Is current date <= end date: ${new Date() <= user.timeFrame.endDate}`);
    }

    // If the user has no time frame or it's expired, let's set a new one
    if (!user.timeFrame.isWithinTimeFrame) {
      console.log(`\n=== SETTING NEW TIME FRAME ===`);
      const adminId = '67f4139ef61083ea7f45e625'; // Using the same user as admin for this debug
      const startDate = new Date();
      const duration = 30; // 30 days
      const durationType = 'days';
      
      user.updateTimeFrame(startDate, duration, durationType, adminId, {
        notes: 'Debug: Setting time frame to enable quiz access'
      });
      
      await user.save();
      console.log(`New time frame set:`, {
        startDate: user.timeFrame.startDate,
        duration: user.timeFrame.duration,
        durationType: user.timeFrame.durationType,
        endDate: user.timeFrame.endDate,
        isWithinTimeFrame: user.timeFrame.isWithinTimeFrame
      });
    } else {
      await user.save();
    }

    console.log(`\n=== PENDING QUIZZES ===`);
    console.log(`Number of pending quizzes: ${user.pendingQuizzes.length}`);
    user.pendingQuizzes.forEach((pending, index) => {
      console.log(`Quiz ${index + 1}:`, {
        quizId: pending.quizId,
        assignedAt: pending.assignedAt,
        assignmentType: pending.assignmentType,
        isAvailable: pending.isAvailable
      });
    });

    console.log(`\n=== CHECKING QUIZ SETTINGS ===`);
    const quizzes = await Quiz.find({ _id: { $in: user.pendingQuizzes.map(p => p.quizId) } });
    quizzes.forEach(quiz => {
      console.log(`Quiz "${quiz.name}":`, {
        isActive: quiz.isActive,
        triggerType: quiz.triggerType,
        respectUserTimeFrame: quiz.respectUserTimeFrame,
        triggerDelayDays: quiz.triggerDelayDays
      });
    });

    mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');

  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
};

debugUserTimeFrame();
