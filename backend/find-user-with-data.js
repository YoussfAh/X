import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const findUserWithData = async () => {
  await connectDB();
  
  try {
    // Import models
    const User = (await import('./models/userModel.js')).default;
    const Workout = (await import('./models/workoutModel.js')).default;
    const DietEntry = (await import('./models/dietEntryModel.js')).default;
    
    console.log('Looking for users with data...');
    
    // Find users with workouts
    const usersWithWorkouts = await Workout.aggregate([
      { $group: { _id: "$user", workoutCount: { $sum: 1 } } },
      { $match: { workoutCount: { $gt: 0 } } },
      { $sort: { workoutCount: -1 } },
      { $limit: 5 }
    ]);
    
    console.log('Users with workouts:', usersWithWorkouts);
    
    // Find users with diet entries
    const usersWithDiet = await DietEntry.aggregate([
      { $group: { _id: "$user", dietCount: { $sum: 1 } } },
      { $match: { dietCount: { $gt: 0 } } },
      { $sort: { dietCount: -1 } },
      { $limit: 5 }
    ]);
    
    console.log('Users with diet entries:', usersWithDiet);
    
    // Get user details
    if (usersWithWorkouts.length > 0) {
      const userId = usersWithWorkouts[0]._id;
      const user = await User.findById(userId).select('name email');
      console.log('User with most workouts:', user, 'has', usersWithWorkouts[0].workoutCount, 'workouts');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
};

findUserWithData();
