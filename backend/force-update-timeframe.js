// Force update user timeframe status
import mongoose from 'mongoose';
import User from './models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

const forceUpdateTimeFrame = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const userId = '67f4139ef61083ea7f45e625';
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Before update:', {
      startDate: user.timeFrame.startDate,
      endDate: user.timeFrame.endDate,
      isWithinTimeFrame: user.timeFrame.isWithinTimeFrame,
      currentDate: new Date()
    });

    // Manually update the timeFrame status
    user.updateTimeFrameStatus();
    
    // Force save the user
    await user.save();
    console.log('User saved successfully');

    // Fetch fresh user data to verify
    const updatedUser = await User.findById(userId);
    console.log('After update:', {
      startDate: updatedUser.timeFrame.startDate,
      endDate: updatedUser.timeFrame.endDate,
      isWithinTimeFrame: updatedUser.timeFrame.isWithinTimeFrame,
      currentDate: new Date()
    });

    mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
};

forceUpdateTimeFrame();
