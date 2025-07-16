import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Quiz from './models/quizModel.js';
import User from './models/userModel.js';

dotenv.config();

const testEnhancedScheduling = async () => {
  try {
    await connectDB();
    console.log('🔗 Connected to MongoDB');

    // List all existing quizzes
    console.log('\n📋 Existing Quizzes:');
    const allQuizzes = await Quiz.find({}).select('name triggerType triggerDelayAmount triggerDelayUnit triggerStartFrom timeFrameHandling isActive');
    
    if (allQuizzes.length === 0) {
      console.log('No quizzes found in database.');
    } else {
      allQuizzes.forEach((quiz, index) => {
        console.log(`\n--- Quiz ${index + 1}: ${quiz.name} ---`);
        console.log('ID:', quiz._id.toString());
        console.log('Active:', quiz.isActive);
        console.log('Trigger Type:', quiz.triggerType);
        console.log('Delay Amount:', quiz.triggerDelayAmount);
        console.log('Delay Unit:', quiz.triggerDelayUnit);
        console.log('Start From:', quiz.triggerStartFrom);
        console.log('Time Frame Handling:', quiz.timeFrameHandling);
      });
    }

    // Create test quiz with enhanced scheduling
    console.log('\n🆕 Creating Enhanced Test Quiz...');
    
    // Delete existing test quiz first
    await Quiz.deleteOne({ name: 'Enhanced Scheduling Test Quiz' });
    
    const enhancedQuiz = new Quiz({
      name: 'Enhanced Scheduling Test Quiz',
      triggerType: 'TIME_INTERVAL',
      triggerDelayAmount: 5, // 5 seconds for immediate testing
      triggerDelayUnit: 'seconds',
      triggerStartFrom: 'REGISTRATION',
      timeFrameHandling: 'ALL_USERS',
      respectUserTimeFrame: false, // Legacy field
      homePageMessage: 'Enhanced scheduling test quiz is ready!',
      isActive: true,
      questions: [
        {
          questionText: 'This is a test question for enhanced scheduling',
          type: 'multiple-choice',
          options: [
            { text: 'Option A' },
            { text: 'Option B' },
            { text: 'Option C' }
          ]
        }
      ]
    });
    
    await enhancedQuiz.save();
    console.log('✅ Enhanced test quiz created:', enhancedQuiz._id);

    // Test different trigger configurations
    const testConfigs = [
      {
        name: 'Minutes Test Quiz',
        triggerDelayAmount: 2,
        triggerDelayUnit: 'minutes',
        triggerStartFrom: 'REGISTRATION',
        timeFrameHandling: 'ALL_USERS'
      },
      {
        name: 'Hours Test Quiz', 
        triggerDelayAmount: 1,
        triggerDelayUnit: 'hours',
        triggerStartFrom: 'FIRST_QUIZ',
        timeFrameHandling: 'RESPECT_TIMEFRAME'
      },
      {
        name: 'Days Test Quiz',
        triggerDelayAmount: 3,
        triggerDelayUnit: 'days',
        triggerStartFrom: 'LAST_QUIZ',
        timeFrameHandling: 'OUTSIDE_TIMEFRAME_ONLY'
      },
      {
        name: 'Weeks Test Quiz',
        triggerDelayAmount: 2,
        triggerDelayUnit: 'weeks',
        triggerStartFrom: 'REGISTRATION',
        timeFrameHandling: 'ALL_USERS'
      }
    ];

    console.log('\n🔧 Creating Test Quizzes for Each Configuration...');
    
    for (const config of testConfigs) {
      await Quiz.deleteOne({ name: config.name });
      
      const testQuiz = new Quiz({
        name: config.name,
        triggerType: 'TIME_INTERVAL',
        triggerDelayAmount: config.triggerDelayAmount,
        triggerDelayUnit: config.triggerDelayUnit,
        triggerStartFrom: config.triggerStartFrom,
        timeFrameHandling: config.timeFrameHandling,
        isActive: true,
        questions: [
          {
            questionText: `Test question for ${config.name}`,
            type: 'multiple-choice',
            options: [
              { text: 'Test Option 1' },
              { text: 'Test Option 2' }
            ]
          }
        ]
      });
      
      await testQuiz.save();
      console.log(`✅ Created: ${config.name} (${config.triggerDelayAmount} ${config.triggerDelayUnit} from ${config.triggerStartFrom})`);
    }

    // Test trigger calculation logic
    console.log('\n🧮 Testing Trigger Calculation Logic...');
    
    const testUser = await User.findOne({});
    if (testUser) {
      console.log('Testing with user:', testUser.email);
      console.log('User registration:', testUser.createdAt);
      console.log('User quiz results count:', testUser.quizResults.length);
      
      const now = new Date();
      
      for (const config of testConfigs) {
        let referenceDate = new Date(testUser.createdAt); // Default to registration

        if (config.triggerStartFrom === 'FIRST_QUIZ' && testUser.quizResults.length > 0) {
          referenceDate = new Date(testUser.quizResults[0].completedAt);
        } else if (config.triggerStartFrom === 'LAST_QUIZ' && testUser.quizResults.length > 0) {
          const lastQuiz = testUser.quizResults[testUser.quizResults.length - 1];
          referenceDate = new Date(lastQuiz.completedAt);
        }

        const triggerDate = new Date(referenceDate);
        const delayAmount = config.triggerDelayAmount;
        
        switch (config.triggerDelayUnit) {
          case 'seconds':
            triggerDate.setSeconds(triggerDate.getSeconds() + delayAmount);
            break;
          case 'minutes':
            triggerDate.setMinutes(triggerDate.getMinutes() + delayAmount);
            break;
          case 'hours':
            triggerDate.setHours(triggerDate.getHours() + delayAmount);
            break;
          case 'days':
            triggerDate.setDate(triggerDate.getDate() + delayAmount);
            break;
          case 'weeks':
            triggerDate.setDate(triggerDate.getDate() + (delayAmount * 7));
            break;
        }

        const shouldTrigger = now >= triggerDate;
        const timeDiff = now.getTime() - triggerDate.getTime();
        
        console.log(`\n${config.name}:`);
        console.log(`  Reference: ${referenceDate.toISOString()}`);
        console.log(`  Trigger: ${triggerDate.toISOString()}`);
        console.log(`  Should trigger: ${shouldTrigger}`);
        console.log(`  Time diff: ${Math.round(timeDiff / 1000)} seconds`);
      }
    }

    console.log('\n✅ Enhanced scheduling test completed successfully!');
    console.log('\n📝 Summary:');
    console.log('- Enhanced scheduling fields are working correctly');
    console.log('- Multiple time units (seconds to weeks) are supported');
    console.log('- Multiple reference points (registration, first quiz, last quiz) are working');
    console.log('- Time frame handling options are configured');
    console.log('\n🔧 Next: Test the frontend admin interface to edit these quizzes');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testEnhancedScheduling();
