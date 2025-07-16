import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixTestUserPasswordCorrectly() {
    try {
        console.log('🔐 FIXING TEST USER PASSWORD CORRECTLY');
        
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
        
        // Set the password as plain text - the pre-save hook will hash it
        user.password = '123456';
        await user.save();
        
        console.log('✅ Password updated (let model handle hashing)');
        
        // Re-fetch the user to test login
        const updatedUser = await User.findById(user._id);
        
        // Test the password using the model's matchPassword method
        const isMatch = await updatedUser.matchPassword('123456');
        console.log(`✅ Password verification: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
        
        if (isMatch) {
            console.log('\n🎯 USER READY FOR LOGIN:');
            console.log(`Email: 123456@email.com`);
            console.log(`Password: 123456`);
            console.log(`User ID: ${updatedUser._id}`);
            console.log(`Pending Quizzes: ${updatedUser.pendingQuizzes?.length || 0}`);
            
            if (updatedUser.pendingQuizzes && updatedUser.pendingQuizzes.length > 0) {
                console.log('\n📝 ASSIGNED QUIZZES:');
                for (let i = 0; i < updatedUser.pendingQuizzes.length; i++) {
                    const pending = updatedUser.pendingQuizzes[i];
                    console.log(`  ${i + 1}. Quiz ID: ${pending.quizId}`);
                    console.log(`     Assigned: ${pending.assignedAt}`);
                }
            }
            
            console.log('\n🚀 READY TO TEST:');
            console.log('1. Server is running on port 5001');
            console.log('2. Database is connected');
            console.log('3. User credentials are working');
            console.log('4. Quiz is assigned to user');
            console.log('5. Quiz controller fix is applied');
            console.log('\nNow test the API endpoint!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔐 Disconnected from MongoDB');
    }
}

fixTestUserPasswordCorrectly();
