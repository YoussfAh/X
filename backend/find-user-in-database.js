import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function findUserInWorkingDatabase() {
    try {
        console.log('🔍 SEARCHING FOR USER DATA IN WORKING DATABASE');
        
        // Use the working connection string
        const workingUri = 'mongodb+srv://yousseefah:yousseefah@cluster0.a7kzq.mongodb.net/pro_g?retryWrites=true&w=majority';
        await mongoose.connect(workingUri);
        console.log('✅ Connected to working database');
        
        // Import models
        const User = mongoose.models.User || await import('./models/userModel.js').then(m => m.default);
        const Quiz = mongoose.models.Quiz || await import('./models/quizModel.js').then(m => m.default);
        
        console.log('\n📊 DATABASE CONTENTS:');
        
        // List all users
        const users = await User.find({}).limit(10);
        console.log(`Total users: ${users.length}`);
        
        for (let i = 0; i < Math.min(users.length, 5); i++) {
            const user = users[i];
            console.log(`  ${i + 1}. ${user.email} (ID: ${user._id})`);
            if (user.pendingQuizzes && user.pendingQuizzes.length > 0) {
                console.log(`     Pending quizzes: ${user.pendingQuizzes.length}`);
            }
        }
        
        // List all quizzes
        const quizzes = await Quiz.find({}).limit(10);
        console.log(`\nTotal quizzes: ${quizzes.length}`);
        
        for (let i = 0; i < Math.min(quizzes.length, 5); i++) {
            const quiz = quizzes[i];
            console.log(`  ${i + 1}. "${quiz.name}" (ID: ${quiz._id})`);
            console.log(`     Questions: ${quiz.questions?.length || 0}, Active: ${quiz.isActive}`);
        }
        
        // Check for our specific email patterns
        console.log('\n🔍 Searching for target user patterns:');
        const targetUser1 = await User.findOne({ email: '123456@email.com' });
        const targetUser2 = await User.findOne({ email: 'admin@email.com' });
        const targetUser3 = await User.findById('67f4139ef61083ea7f45e625').catch(() => null);
        
        if (targetUser1) {
            console.log('✅ Found 123456@email.com');
            console.log(`   ID: ${targetUser1._id}`);
            console.log(`   Pending quizzes: ${targetUser1.pendingQuizzes?.length || 0}`);
        }
        
        if (targetUser2) {
            console.log('✅ Found admin@email.com');
            console.log(`   ID: ${targetUser2._id}`);
            console.log(`   Pending quizzes: ${targetUser2.pendingQuizzes?.length || 0}`);
        }
        
        if (targetUser3) {
            console.log('✅ Found user by ID 67f4139ef61083ea7f45e625');
            console.log(`   Email: ${targetUser3.email}`);
            console.log(`   Pending quizzes: ${targetUser3.pendingQuizzes?.length || 0}`);
        }
        
        if (!targetUser1 && !targetUser2 && !targetUser3) {
            console.log('❌ Target users not found');
            console.log('\n💡 Creating test user and quiz assignment...');
            
            // Create a test user
            const testUser = new User({
                name: 'Test User',
                email: '123456@email.com',
                password: '$2a$10$1234567890abcdefghijklmnopqrstuvwxyz', // placeholder hash
                timeFrame: {
                    isWithinTimeFrame: true,
                    timeFrameStart: new Date(),
                    timeFrameEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                }
            });
            
            await testUser.save();
            console.log(`✅ Created test user: ${testUser._id}`);
            
            // Create a test quiz
            const testQuiz = new Quiz({
                name: 'Test Quiz',
                questions: [
                    {
                        questionText: 'What is your fitness goal?',
                        type: 'multiple-choice',
                        options: [
                            { text: 'Weight loss' },
                            { text: 'Muscle gain' },
                            { text: 'Maintenance' }
                        ]
                    }
                ],
                isActive: true,
                triggerType: 'ADMIN_ASSIGNMENT',
                timeFrameHandling: 'ALL_USERS'
            });
            
            await testQuiz.save();
            console.log(`✅ Created test quiz: ${testQuiz._id}`);
            
            // Assign quiz to user
            testUser.pendingQuizzes.push({
                quizId: testQuiz._id,
                assignedAt: new Date(),
                assignedBy: new mongoose.Types.ObjectId()
            });
            
            await testUser.save();
            console.log('✅ Assigned quiz to user');
            
            console.log('\n🎯 TEST SETUP COMPLETE:');
            console.log(`Database URI: ${workingUri}`);
            console.log(`User ID: ${testUser._id}`);
            console.log(`User Email: ${testUser.email}`);
            console.log(`Quiz ID: ${testQuiz._id}`);
        } else {
            console.log('\n✅ Found existing user data - no need to create test data');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔐 Disconnected from MongoDB');
    }
}

findUserInWorkingDatabase();
