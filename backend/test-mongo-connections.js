import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testMongoConnection() {
    const connectionStrings = [
        // Current .env
        process.env.MONGO_URI,
        // Original working string from test scripts
        'mongodb+srv://pro-g:prog123@cluster0.a7kzq.mongodb.net/pro_g?retryWrites=true&w=majority&appName=Cluster0',
        // Alternative strings
        'mongodb+srv://yousseefah:yousseefah@cluster0.a7kzq.mongodb.net/pro_g?retryWrites=true&w=majority',
        'mongodb+srv://grindxteam:grindx123@cluster0.pmkcwn6.mongodb.net/one?retryWrites=true&w=majority',
    ];

    for (let i = 0; i < connectionStrings.length; i++) {
        const uri = connectionStrings[i];
        if (!uri) continue;
        
        console.log(`\n🧪 Testing connection ${i + 1}:`);
        console.log(`URI: ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
        
        try {
            await mongoose.connect(uri);
            console.log('✅ CONNECTION SUCCESSFUL!');
            
            // Test if we can find our target user
            const User = mongoose.models.User || await import('./models/userModel.js').then(m => m.default);
            const user = await User.findOne({ email: '123456@email.com' });
            
            if (user) {
                console.log('✅ Target user found!');
                console.log(`User ID: ${user._id}`);
                console.log(`Pending quizzes: ${user.pendingQuizzes?.length || 0}`);
            } else {
                console.log('❌ Target user not found in this database');
            }
            
            await mongoose.disconnect();
            
            if (user) {
                console.log('\n🎯 WORKING DATABASE FOUND!');
                console.log(`Use this URI: ${uri}`);
                return uri;
            }
            
        } catch (error) {
            console.log(`❌ Connection failed: ${error.message}`);
            try {
                await mongoose.disconnect();
            } catch (e) {}
        }
    }
    
    console.log('\n❌ No working database connection found');
    return null;
}

testMongoConnection();
