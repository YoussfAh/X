import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function setupMultipleQuizzesQueue() {
    try {
        console.log('🎯 SETTING UP MULTIPLE QUIZZES QUEUE');
        console.log('====================================');
        
        const workingUri = 'mongodb+srv://yousseefah:yousseefah@cluster0.a7kzq.mongodb.net/pro_g?retryWrites=true&w=majority';
        await mongoose.connect(workingUri);
        console.log('✅ Connected to database');
        
        const User = mongoose.models.User || await import('./models/userModel.js').then(m => m.default);
        const Quiz = mongoose.models.Quiz || await import('./models/quizModel.js').then(m => m.default);
        
        // Find our test user
        const user = await User.findOne({ email: '123456@email.com' });
        
        if (!user) {
            console.log('❌ Test user not found');
            return;
        }
        
        console.log(`👤 User: ${user.email}`);
        
        // Create multiple test quizzes for queue testing
        console.log('\n📝 Creating multiple test quizzes...');
        
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
            timeFrameHandling: 'ALL_USERS',
            completionMessage: 'Great! You completed Quiz 1. Your next quiz is ready!'
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
            timeFrameHandling: 'ALL_USERS',
            completionMessage: 'Excellent! Quiz 2 completed. One more quiz to go!'
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
            timeFrameHandling: 'ALL_USERS',
            completionMessage: 'Perfect! All quizzes completed. Your personalized plan is ready!'
        });
        
        await quiz1.save();
        await quiz2.save();
        await quiz3.save();
        
        console.log('✅ Created 3 test quizzes');
        
        // Clear existing pending quizzes and add new ones in queue order
        user.pendingQuizzes = [
            {
                quizId: quiz1._id,
                assignedAt: new Date(Date.now() - 30000), // 30 seconds ago (first)
                assignedBy: new mongoose.Types.ObjectId()
            },
            {
                quizId: quiz2._id,
                assignedAt: new Date(Date.now() - 20000), // 20 seconds ago (second)
                assignedBy: new mongoose.Types.ObjectId()
            },
            {
                quizId: quiz3._id,
                assignedAt: new Date(Date.now() - 10000), // 10 seconds ago (third)
                assignedBy: new mongoose.Types.ObjectId()
            }
        ];
        
        await user.save();
        console.log('✅ Assigned 3 quizzes to user in queue order');
        
        // Verify the setup
        const updatedUser = await User.findOne({ email: '123456@email.com' }).populate({
            path: 'pendingQuizzes.quizId',
            model: 'Quiz',
        });
        
        console.log('\n📊 QUIZ QUEUE SETUP COMPLETE:');
        console.log('==============================');
        
        const sortedPendingQuizzes = updatedUser.pendingQuizzes.sort(
            (a, b) => new Date(a.assignedAt) - new Date(b.assignedAt)
        );
        
        for (let i = 0; i < sortedPendingQuizzes.length; i++) {
            const pending = sortedPendingQuizzes[i];
            const quiz = pending.quizId;
            
            console.log(`${i + 1}. "${quiz.name}"`);
            console.log(`   Quiz ID: ${quiz._id}`);
            console.log(`   Questions: ${quiz.questions.length}`);
            console.log(`   Completion Message: "${quiz.completionMessage}"`);
            console.log('');
        }
        
        console.log('🎯 QUEUE TEST READY:');
        console.log('====================');
        console.log('1. Go to http://localhost:3000/quiz');
        console.log('2. Login as: 123456@email.com / 123456');
        console.log('3. Should see: "Quiz 1 - Fitness Goals"');
        console.log('4. Complete it → should see completion message');
        console.log('5. Go back to /quiz → should see "Quiz 2 - Exercise Preferences"');
        console.log('6. Complete it → should see completion message');
        console.log('7. Go back to /quiz → should see "Quiz 3 - Schedule & Availability"');
        console.log('8. Complete it → should see final completion message');
        console.log('9. Go back to /quiz → should see "No active quiz available"');
        
        console.log('\n💡 If this flow doesn\'t work, the issue is in:');
        console.log('1. Frontend not refetching after quiz completion');
        console.log('2. Backend not removing completed quizzes from pending');
        console.log('3. Backend not returning next quiz in queue');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔐 Disconnected from MongoDB');
    }
}

setupMultipleQuizzesQueue();
