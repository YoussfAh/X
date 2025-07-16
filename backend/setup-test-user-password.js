import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function setupTestUserPassword() {
    try {
        console.log('🔐 SETTING UP TEST USER PASSWORD');
        
        const workingUri = 'mongodb+srv://yousseefah:yousseefah@cluster0.a7kzq.mongodb.net/pro_g?retryWrites=true&w=majority';
        await mongoose.connect(workingUri);
        console.log('✅ Connected to database');
        
        const User = mongoose.models.User || await import('./models/userModel.js').then(m => m.default);
        
        // Find our test user
        const user = await User.findOne({ email: '123456@email.com' });
        
        if (!user) {
            console.log('❌ Test user not found');
            return;
        }
        
        console.log(`✅ Found user: ${user.email} (ID: ${user._id})`);
        
        // Hash the password properly
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);
        
        // Update the user's password
        user.password = hashedPassword;
        await user.save();
        
        console.log('✅ Password updated successfully');
        
        // Test the password
        const isMatch = await bcrypt.compare('123456', user.password);
        console.log(`✅ Password verification: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
        
        console.log('\n📊 USER INFO:');
        console.log(`Email: ${user.email}`);
        console.log(`ID: ${user._id}`);
        console.log(`Pending Quizzes: ${user.pendingQuizzes?.length || 0}`);
        console.log(`TimeFrame Status: ${user.timeFrame?.isWithinTimeFrame}`);
        
        if (user.pendingQuizzes && user.pendingQuizzes.length > 0) {
            console.log('\n📝 QUIZ ASSIGNMENTS:');
            for (let i = 0; i < user.pendingQuizzes.length; i++) {
                const pending = user.pendingQuizzes[i];
                console.log(`  ${i + 1}. Quiz ID: ${pending.quizId}`);
                console.log(`     Assigned: ${pending.assignedAt}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔐 Disconnected from MongoDB');
    }
}

setupTestUserPassword();
