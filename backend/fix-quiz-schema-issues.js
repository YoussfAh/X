import mongoose from 'mongoose';
import Quiz from './models/quizModel.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixQuizSchemaIssues() {
  try {
    console.log('=== EXAMINING QUIZ SCHEMA MISMATCH ===');

    // Get a quiz document to see actual structure
    const sampleQuiz = await Quiz.findOne();
    if (sampleQuiz) {
      console.log('Sample quiz structure:');
      console.log(`- name: "${sampleQuiz.name}"`);
      console.log(`- isActive: ${sampleQuiz.isActive}`);
      console.log(`- triggerType: "${sampleQuiz.triggerType}"`);
      console.log(`- timeFrameHandling: "${sampleQuiz.timeFrameHandling}"`);
      console.log(`- questions: ${sampleQuiz.questions?.length || 0}`);
    }

    // Create a proper test quiz with correct fields
    console.log('\n=== CREATING TEST QUIZ ===');

    const testQuiz = new Quiz({
      name: 'Working Test Quiz',
      isActive: true,
      triggerType: 'ADMIN_ASSIGNMENT',
      timeFrameHandling: 'ALL_USERS',
      homePageMessage: 'Test quiz ready for you!',
      completionMessage: 'Test completed successfully!',
      questions: [
        {
          questionText: 'What is your current fitness goal?',
          type: 'multiple-choice',
          options: [
            { text: 'Weight Loss' },
            { text: 'Muscle Gain' },
            { text: 'General Fitness' },
            { text: 'Athletic Performance' },
          ],
        },
        {
          questionText: 'How many days per week do you want to exercise?',
          type: 'multiple-choice',
          options: [
            { text: '3 days' },
            { text: '4 days' },
            { text: '5 days' },
            { text: '6+ days' },
          ],
        },
      ],
    });

    const savedQuiz = await testQuiz.save();
    console.log(
      `✅ Created test quiz: "${savedQuiz.name}" (ID: ${savedQuiz._id})`
    );

    // Create another quiz that respects time frame
    const timeFrameQuiz = new Quiz({
      name: 'Time Frame Sensitive Quiz',
      isActive: true,
      triggerType: 'ADMIN_ASSIGNMENT',
      timeFrameHandling: 'RESPECT_TIMEFRAME',
      questions: [
        {
          questionText:
            'This quiz only appears during your active hours. What time is it now?',
          type: 'multiple-choice',
          options: [
            { text: 'Morning' },
            { text: 'Afternoon' },
            { text: 'Evening' },
            { text: 'Night' },
          ],
        },
      ],
    });

    const savedTimeFrameQuiz = await timeFrameQuiz.save();
    console.log(
      `✅ Created time frame quiz: "${savedTimeFrameQuiz.name}" (ID: ${savedTimeFrameQuiz._id})`
    );

    console.log('\n=== VERIFICATION ===');
    const allQuizzes = await Quiz.find({ isActive: true });
    console.log(`Active quizzes in system: ${allQuizzes.length}`);

    allQuizzes.forEach((quiz) => {
      console.log(
        `- "${quiz.name}" (${quiz.triggerType}, ${quiz.timeFrameHandling})`
      );
    });

    // The quiz controller virtual fields
    console.log('\n=== TESTING VIRTUAL FIELD ACCESS ===');
    const firstQuiz = allQuizzes[0];
    if (firstQuiz) {
      console.log('Raw quiz object fields:');
      console.log(`- name: "${firstQuiz.name}"`);
      console.log(`- isActive: ${firstQuiz.isActive}`);
      console.log(`- triggerType: "${firstQuiz.triggerType}"`);

      // Test virtual/alias access that controller expects
      console.log('Testing expected controller fields:');
      console.log(`- title: "${firstQuiz.title || 'UNDEFINED'}"`);
      console.log(`- status: "${firstQuiz.status || 'UNDEFINED'}"`);
      console.log(`- trigger: "${firstQuiz.trigger || 'UNDEFINED'}"`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

fixQuizSchemaIssues();
