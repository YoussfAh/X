import mongoose from 'mongoose';
import User from './models/userModel.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function resetTargetUserPassword() {
  try {
    console.log('=== Resetting Target User Password ===');

    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URI ||
        'mongodb+srv://pro-g:prog123@cluster0.a7kzq.mongodb.net/pro_g?retryWrites=true&w=majority&appName=Cluster0'
    );
    console.log('Connected to MongoDB');

    // Target user ID from admin panel
    const targetUserId = '67f4139ef61083ea7f45e625';

    // Find target user
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      console.log('❌ Target user not found');
      return;
    }

    console.log(`\n👤 Resetting password for: ${targetUser.email}`);

    // Set a simple password
    const newPassword = '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    targetUser.password = hashedPassword;
    await targetUser.save();

    console.log(`✅ Password reset successfully!`);
    console.log(`\n🔐 Login Credentials:`);
    console.log(`Email: ${targetUser.email}`);
    console.log(`Password: ${newPassword}`);

    console.log(`\n📋 Test Instructions:`);
    console.log(`1. Go to: http://localhost:3000/login`);
    console.log(`2. Login with:`);
    console.log(`   Email: ${targetUser.email}`);
    console.log(`   Password: ${newPassword}`);
    console.log(`3. After login, go to: http://localhost:3000/quiz`);
    console.log(`4. You should see the assigned quiz!`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔐 Disconnected from MongoDB');
  }
}

resetTargetUserPassword();
