import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkQuizQueueStatus() {
    try {
        console.log('📋 CHECKING QUIZ QUEUE STATUS');
        console.log('===============================');
        
        const workingUri = 'mongodb+srv://yousseefah:yousseefah@cluster0.a7kzq.mongodb.net/pro_g?retryWrites=true&w=majority';
        await mongoose.connect(workingUri);
        console.log('✅ Connected to database');
        
        const User = mongoose.models.User || await import('./models/userModel.js').then(m => m.default);
        const Quiz = mongoose.models.Quiz || await import('./models/quizModel.js').then(m => m.default);
        
        // Find our test user
        const user = await User.findOne({ email: '123456@email.com' }).populate({
            path: 'pendingQuizzes.quizId',
            model: 'Quiz',
        });
        
        if (!user) {
            console.log('❌ Test user not found');
            return;
        }
        
        console.log(`👤 User: ${user.email}`);
        console.log(`📝 Total pending quizzes: ${user.pendingQuizzes.length}`);
        
        if (user.pendingQuizzes.length === 0) {
            console.log('❌ No pending quizzes found');
            console.log('💡 Let me create multiple test quizzes for queue testing...');
            
            // Create multiple test quizzes
            const quiz1 = new Quiz({
                name: 'Quiz 1 - Fitness Goals',
                questions: [
                    {
                        questionText: 'What is your primary fitness goal?',
                        type: 'multiple-choice',
                        options: [
                            { text: 'Weight loss' },
                            { text: 'Muscle gain' },
                            { text: 'Endurance' },
                            { text: 'General health' }
                        ]
                    }
                ],
                isActive: true,
                triggerType: 'ADMIN_ASSIGNMENT',
                timeFrameHandling: 'ALL_USERS'
            });
            
            const quiz2 = new Quiz({
                name: 'Quiz 2 - Exercise Preferences',
                questions: [
                    {
                        questionText: 'What type of exercise do you prefer?',
                        type: 'multiple-choice',
                        options: [
                            { text: 'Cardio' },
                            { text: 'Weight training' },
                            { text: 'Yoga/Stretching' },
                            { text: 'Sports' }
                        ]
                    }
                ],
                isActive: true,
                triggerType: 'ADMIN_ASSIGNMENT',
                timeFrameHandling: 'ALL_USERS'
            });
            
            const quiz3 = new Quiz({
                name: 'Quiz 3 - Schedule & Availability',
                questions: [
                    {
                        questionText: 'How many days per week can you exercise?',
                        type: 'multiple-choice',
                        options: [
                            { text: '1-2 days' },
                            { text: '3-4 days' },
                            { text: '5-6 days' },
                            { text: '7 days' }
                        ]
                    }
                ],
                isActive: true,
                triggerType: 'ADMIN_ASSIGNMENT',
                timeFrameHandling: 'ALL_USERS'
            });
            
            await quiz1.save();
            await quiz2.save();
            await quiz3.save();
            
            console.log('✅ Created 3 test quizzes');
            
            // Clear existing pending quizzes and add new ones in order
            user.pendingQuizzes = [
                {
                    quizId: quiz1._id,
                    assignedAt: new Date(Date.now() - 3000), // 3 seconds ago
                    assignedBy: new mongoose.Types.ObjectId()
                },
                {
                    quizId: quiz2._id,
                    assignedAt: new Date(Date.now() - 2000), // 2 seconds ago
                    assignedBy: new mongoose.Types.ObjectId()
                },
                {
                    quizId: quiz3._id,
                    assignedAt: new Date(Date.now() - 1000), // 1 second ago
                    assignedBy: new mongoose.Types.ObjectId()
                }
            ];
            
            await user.save();
            console.log('✅ Assigned 3 quizzes to user in queue order');
        }
        
        // Re-fetch user with populated quizzes
        const updatedUser = await User.findOne({ email: '123456@email.com' }).populate({
            path: 'pendingQuizzes.quizId',
            model: 'Quiz',
        });
        
        console.log('\n📊 CURRENT QUIZ QUEUE:');
        console.log('======================');
        
        for (let i = 0; i < updatedUser.pendingQuizzes.length; i++) {
            const pending = updatedUser.pendingQuizzes[i];
            const quiz = pending.quizId;
            
            console.log(`${i + 1}. "${quiz.name}"`);
            console.log(`   Quiz ID: ${quiz._id}`);
            console.log(`   Questions: ${quiz.questions.length}`);
            console.log(`   Assigned: ${pending.assignedAt}`);
            console.log(`   Active: ${quiz.isActive}`);
            console.log(`   TimeFrame: ${quiz.timeFrameHandling}`);
            console.log('');
        }
        
        // Sort by assigned date to see queue order
        const sortedPendingQuizzes = updatedUser.pendingQuizzes.sort(
            (a, b) => new Date(a.assignedAt) - new Date(b.assignedAt)
        );
        
        console.log('🎯 QUEUE ORDER (by assignment time):');
        for (let i = 0; i < sortedPendingQuizzes.length; i++) {
            const pending = sortedPendingQuizzes[i];
            const quiz = pending.quizId;
            console.log(`   ${i + 1}. "${quiz.name}" (${quiz._id})`);
        }
        
        if (sortedPendingQuizzes.length > 0) {
            const firstQuiz = sortedPendingQuizzes[0].quizId;
            console.log(`\n🥇 NEXT QUIZ TO SHOW: "${firstQuiz.name}"`);
            console.log('✅ This is what the API should return first');
        }
        
        console.log('\n🎯 EXPECTED BEHAVIOR:');
        console.log('1. User goes to /quiz → sees "Quiz 1 - Fitness Goals"');
        console.log('2. User completes Quiz 1 → Quiz 1 removed from pending');
        console.log('3. User goes to /quiz → sees "Quiz 2 - Exercise Preferences"');
        console.log('4. User completes Quiz 2 → Quiz 2 removed from pending');
        console.log('5. User goes to /quiz → sees "Quiz 3 - Schedule & Availability"');
        console.log('6. User completes Quiz 3 → No more quizzes, shows "No active quiz"');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔐 Disconnected from MongoDB');
    }
}

checkQuizQueueStatus();
