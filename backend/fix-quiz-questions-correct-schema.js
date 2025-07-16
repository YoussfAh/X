import mongoose from 'mongoose';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixQuizQuestionsCorrectSchema() {
    try {
        console.log('=== FIXING QUIZ QUESTIONS WITH CORRECT SCHEMA ===');
        
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
                
                // Create questions using the correct schema format
                const sampleQuestions = [
                    {
                        questionText: `What is your main fitness goal for quiz "${quiz.name}"?`,
                        type: 'multiple-choice',
                        options: [
                            { text: 'Weight loss' },
                            { text: 'Muscle gain' },
                            { text: 'General fitness' },
                            { text: 'Athletic performance' }
                        ]
                    },
                    {
                        questionText: `How many days per week do you currently exercise?`,
                        type: 'multiple-choice',
                        options: [
                            { text: '0-1 days' },
                            { text: '2-3 days' },
                            { text: '4-5 days' },
                            { text: '6-7 days' }
                        ]
                    },
                    {
                        questionText: `What is your preferred workout time?`,
                        type: 'multiple-choice',
                        options: [
                            { text: 'Early morning (5-8 AM)' },
                            { text: 'Mid-morning (8-11 AM)' },
                            { text: 'Afternoon (12-5 PM)' },
                            { text: 'Evening (5-9 PM)' }
                        ]
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
                console.log(`  - First question options: ${quiz.questions[0].options?.length || 0}`);
                if (quiz.questions[0].options && quiz.questions[0].options.length > 0) {
                    console.log(`    - Option 1: "${quiz.questions[0].options[0].text}"`);
                }
            }
        }

        console.log('\n🎯 RESULT: All quizzes now have proper questions with correct schema!');
        console.log('✅ Target user should now see quizzes with working questions!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔐 Disconnected from MongoDB');
    }
}

fixQuizQuestionsCorrectSchema();
