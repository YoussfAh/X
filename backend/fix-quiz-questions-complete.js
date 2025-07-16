import mongoose from 'mongoose';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixQuizQuestionsForTargetUser() {
    try {
        console.log('=== FIXING QUIZ QUESTIONS FOR TARGET USER ===');
        
        await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://pro-g:prog123@cluster0.a7kzq.mongodb.net/pro_g?retryWrites=true&w=majority&appName=Cluster0');
        console.log('✅ Connected to MongoDB');

        const targetUserId = '67f4139ef61083ea7f45e625';
        
        // Get user and their quizzes
        const user = await User.findById(targetUserId).populate({
            path: 'pendingQuizzes.quizId',
            model: 'Quiz',
        });

        console.log(`\n👤 User: ${user.email}`);
        console.log(`📝 Pending quizzes: ${user.pendingQuizzes.length}`);

        for (let i = 0; i < user.pendingQuizzes.length; i++) {
            const pendingQuiz = user.pendingQuizzes[i];
            const quiz = pendingQuiz.quizId;
            
            console.log(`\n--- Processing Quiz ${i + 1}: "${quiz.name}" ---`);
            console.log(`Questions: ${quiz.questions?.length || 0}`);
            
            if (!quiz.questions || quiz.questions.length === 0) {
                console.log(`❌ Quiz "${quiz.name}" has no questions. Adding sample questions...`);
                
                const sampleQuestions = [
                    {
                        questionText: `What is your main fitness goal for quiz "${quiz.name}"?`,
                        type: 'multiple-choice',
                        options: [
                            'Weight loss',
                            'Muscle gain',
                            'General fitness',
                            'Athletic performance'
                        ],
                        correctAnswer: 0,
                        explanations: ['Great choice for sustainable health!', 'Building strength is key!', 'Perfect balanced approach!', 'Elite performance mindset!']
                    },
                    {
                        questionText: `How many days per week do you currently exercise?`,
                        type: 'multiple-choice',
                        options: [
                            '0-1 days',
                            '2-3 days',
                            '4-5 days',
                            '6-7 days'
                        ],
                        correctAnswer: 2,
                        explanations: ['Starting is the hardest part!', 'Great consistency!', 'Excellent routine!', 'Dedicated athlete!']
                    },
                    {
                        questionText: `What is your preferred workout time?`,
                        type: 'multiple-choice',
                        options: [
                            'Early morning (5-8 AM)',
                            'Mid-morning (8-11 AM)',
                            'Afternoon (12-5 PM)',
                            'Evening (5-9 PM)'
                        ],
                        correctAnswer: 0,
                        explanations: ['Early bird gets the gains!', 'Perfect energy time!', 'Mid-day motivation!', 'End the day strong!']
                    }
                ];

                // Update the quiz with questions
                await Quiz.findByIdAndUpdate(quiz._id, {
                    questions: sampleQuestions,
                    timeFrameHandling: 'ALL_USERS', // Ensure it works for all users
                    isActive: true
                });
                
                console.log(`✅ Added ${sampleQuestions.length} questions to quiz "${quiz.name}"`);
            } else {
                console.log(`✅ Quiz "${quiz.name}" already has ${quiz.questions.length} questions`);
                
                // Still ensure it's set to ALL_USERS for immediate access
                await Quiz.findByIdAndUpdate(quiz._id, {
                    timeFrameHandling: 'ALL_USERS',
                    isActive: true
                });
                console.log(`✅ Updated quiz "${quiz.name}" to allow ALL_USERS`);
            }
        }

        console.log('\n=== VERIFICATION: Updated Quiz State ===');
        
        // Re-fetch and verify
        const updatedUser = await User.findById(targetUserId).populate({
            path: 'pendingQuizzes.quizId',
            model: 'Quiz',
        });

        for (let i = 0; i < updatedUser.pendingQuizzes.length; i++) {
            const pendingQuiz = updatedUser.pendingQuizzes[i];
            const quiz = pendingQuiz.quizId;
            
            console.log(`\nQuiz ${i + 1}: "${quiz.name}"`);
            console.log(`  - Questions: ${quiz.questions?.length || 0}`);
            console.log(`  - Active: ${quiz.isActive}`);
            console.log(`  - TimeFrame: ${quiz.timeFrameHandling}`);
            console.log(`  - Trigger: ${quiz.triggerType}`);
            
            if (quiz.questions && quiz.questions.length > 0) {
                console.log(`  - First question: "${quiz.questions[0].questionText}"`);
            }
        }

        console.log('\n🎯 RESULT: All quizzes now have questions and are set to ALL_USERS');
        console.log('✅ Target user should now see quizzes with proper questions!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔐 Disconnected from MongoDB');
    }
}

fixQuizQuestionsForTargetUser();
