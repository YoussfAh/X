import mongoose from 'mongoose';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function directQuizEndpointTest() {
    try {
        console.log('=== DIRECT QUIZ ENDPOINT TEST ===');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://pro-g:prog123@cluster0.a7kzq.mongodb.net/pro_g?retryWrites=true&w=majority&appName=Cluster0');
        console.log('✅ Connected to MongoDB');

        // Target user ID
        const targetUserId = '67f4139ef61083ea7f45e625';
        
        console.log('\n🎯 TESTING: What target user sees at /quiz');
        
        // Simulate the exact logic from getActiveQuizForUser controller
        console.log(`--- Getting Active Quiz for User: TARGET USER (${targetUserId}) ---`);
        
        const user = await User.findById(targetUserId).populate({
            path: 'pendingQuizzes.quizId',
            model: 'Quiz',
        });

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log(`👤 User: ${user.email}`);
        console.log(`📝 Raw pending quizzes: ${user.pendingQuizzes.length}`);

        // Data Integrity Check & Cleanup (exact same logic as backend)
        const originalPendingCount = user.pendingQuizzes.length;
        const validPendingQuizzes = user.pendingQuizzes.filter((pending) => {
            if (pending.quizId) {
                return true; // Keep it, the quiz exists.
            }
            console.warn(`Data Integrity Warning: User '${user.email}' has a pending quiz reference to a non-existent quiz.`);
            return false; // Discard it.
        });

        console.log(`✅ Valid pending quizzes: ${validPendingQuizzes.length}/${originalPendingCount}`);

        if (validPendingQuizzes.length === 0) {
            console.log('❌ RESULT: Target user would see NO QUIZ (no valid pending quizzes)');
            return;
        }

        // Find Eligible Quiz (exact backend logic)
        const now = new Date();
        let eligibleQuiz = null;

        const sortedPendingQuizzes = validPendingQuizzes.sort(
            (a, b) => new Date(a.assignedAt) - new Date(b.assignedAt)
        );

        console.log('\n📋 Processing quizzes in assignment order:');

        for (const pendingQuiz of sortedPendingQuizzes) {
            const quiz = pendingQuiz.quizId;
            console.log(`\n--- Evaluating quiz: "${quiz.name}" (ID: ${quiz._id}) ---`);

            if (!quiz.isActive) {
                console.log(`❌ Quiz "${quiz.name}" is not active. Skipping.`);
                continue;
            }
            console.log(`✅ Quiz "${quiz.name}" is active.`);

            if (quiz.triggerType === 'TIME_INTERVAL') {
                console.log(`⏰ Checking TIME_INTERVAL trigger...`);
                
                // For time interval quizzes, check scheduled time
                if (pendingQuiz.scheduledFor && new Date(pendingQuiz.scheduledFor) > now) {
                    console.log(`⏰ Quiz scheduled for ${pendingQuiz.scheduledFor}, not ready yet.`);
                    continue;
                }
            }

            if (quiz.triggerType === 'ADMIN_ASSIGNMENT') {
                console.log(`✅ Quiz trigger type is "ADMIN_ASSIGNMENT". No time delay check needed.`);
            }

            // Check timeframe handling
            console.log(`Time frame handling: ${quiz.timeFrameHandling}`);
            
            if (quiz.timeFrameHandling === 'ALL_USERS') {
                console.log(`✅ Quiz allows all users regardless of time frame.`);
                eligibleQuiz = quiz;
                console.log(`*** FOUND ELIGIBLE QUIZ: "${quiz.name}" ***`);
                break;
            } else if (quiz.timeFrameHandling === 'RESPECT_TIMEFRAME') {
                if (user.timeFrame && user.timeFrame.isWithinTimeFrame) {
                    console.log(`✅ User is within timeframe, quiz allows timeframe users.`);
                    eligibleQuiz = quiz;
                    console.log(`*** FOUND ELIGIBLE QUIZ: "${quiz.name}" ***`);
                    break;
                } else {
                    console.log(`❌ User not in valid timeframe or timeframe expired. Skipping.`);
                    continue;
                }
            }
        }

        console.log('\n🎯 FINAL RESULT:');
        if (eligibleQuiz) {
            console.log(`✅ Target user WOULD see quiz: "${eligibleQuiz.name}"`);
            console.log(`   Quiz ID: ${eligibleQuiz._id}`);
            console.log(`   Questions: ${eligibleQuiz.questions?.length || 0}`);
            console.log(`   Trigger Type: ${eligibleQuiz.triggerType}`);
            console.log(`   TimeFrame Handling: ${eligibleQuiz.timeFrameHandling}`);
            
            if (eligibleQuiz.questions && eligibleQuiz.questions.length > 0) {
                console.log(`\n📝 First Question Preview:`);
                console.log(`   "${eligibleQuiz.questions[0].questionText}"`);
                console.log(`   Type: ${eligibleQuiz.questions[0].type}`);
                console.log(`   Options: ${eligibleQuiz.questions[0].options?.length || 0}`);
            }
        } else {
            console.log(`❌ Target user would see: NO QUIZ AVAILABLE`);
            console.log(`   Reason: No eligible quiz found after timeframe checks`);
        }

        console.log('\n📱 API ENDPOINT RESULTS:');
        console.log(`/api/quiz/active-for-user would return:`);
        if (eligibleQuiz) {
            console.log(`{`);
            console.log(`  "_id": "${eligibleQuiz._id}",`);
            console.log(`  "name": "${eligibleQuiz.name}",`);
            console.log(`  "questions": [...${eligibleQuiz.questions?.length || 0} questions...]`);
            console.log(`}`);
        } else {
            console.log(`null`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔐 Disconnected from MongoDB');
    }
}

directQuizEndpointTest();
