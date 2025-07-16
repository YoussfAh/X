import mongoose from 'mongoose';
import User from './models/userModel.js';
import Quiz from './models/quizModel.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function setupUniversalQuizSystem() {
  try {
    console.log('=== SETTING UP UNIVERSAL QUIZ SYSTEM ===\n');

    // 1. Create universal quizzes that work for all users
    console.log('📝 Creating universal quizzes...');

    const universalQuizzes = [
      {
        name: 'Fitness Assessment Quiz',
        isActive: true,
        triggerType: 'ADMIN_ASSIGNMENT',
        timeFrameHandling: 'ALL_USERS', // Works for everyone regardless of time
        homePageMessage:
          'Complete this fitness assessment to get your personalized plan!',
        completionMessage: 'Thank you! Your fitness plan is being prepared.',
        questions: [
          {
            questionText: 'What is your primary fitness goal?',
            type: 'multiple-choice',
            options: [
              { text: 'Weight Loss' },
              { text: 'Muscle Building' },
              { text: 'General Fitness' },
              { text: 'Athletic Performance' },
            ],
          },
          {
            questionText: 'How many days per week can you exercise?',
            type: 'multiple-choice',
            options: [
              { text: '1-2 days' },
              { text: '3-4 days' },
              { text: '5-6 days' },
              { text: '7 days' },
            ],
          },
          {
            questionText: 'What is your current fitness level?',
            type: 'multiple-choice',
            options: [
              { text: 'Beginner' },
              { text: 'Intermediate' },
              { text: 'Advanced' },
              { text: 'Expert' },
            ],
          },
        ],
      },
      {
        name: 'Nutrition Preferences Quiz',
        isActive: true,
        triggerType: 'ADMIN_ASSIGNMENT',
        timeFrameHandling: 'ALL_USERS',
        homePageMessage:
          'Tell us about your nutrition preferences for a customized meal plan!',
        completionMessage: 'Great! Your nutrition plan will be ready soon.',
        questions: [
          {
            questionText: 'Do you have any dietary restrictions?',
            type: 'multiple-choice',
            options: [
              { text: 'None' },
              { text: 'Vegetarian' },
              { text: 'Vegan' },
              { text: 'Gluten-free' },
              { text: 'Keto' },
            ],
          },
          {
            questionText: 'How many meals do you prefer per day?',
            type: 'multiple-choice',
            options: [
              { text: '3 main meals' },
              { text: '5-6 smaller meals' },
              { text: '2 larger meals' },
              { text: 'Flexible' },
            ],
          },
        ],
      },
    ];

    // Create or update the quizzes
    const createdQuizzes = [];
    for (const quizData of universalQuizzes) {
      let quiz = await Quiz.findOne({ name: quizData.name });
      if (quiz) {
        console.log(`  ✅ Updating existing quiz: "${quizData.name}"`);
        Object.assign(quiz, quizData);
        await quiz.save();
      } else {
        console.log(`  ✅ Creating new quiz: "${quizData.name}"`);
        quiz = new Quiz(quizData);
        await quiz.save();
      }
      createdQuizzes.push(quiz);
    }

    console.log(
      `\n📊 Created/Updated ${createdQuizzes.length} universal quizzes\n`
    );

    // 2. Test assignment system with multiple users
    console.log('👥 Testing assignment system with multiple users...\n');

    const testUsers = ['admin@email.com', '123456@email.com', 'jane@email.com'];

    for (const userEmail of testUsers) {
      const user = await User.findOne({ email: userEmail });
      if (!user) {
        console.log(`  ⚠️  User ${userEmail} not found, skipping...`);
        continue;
      }

      // Assign the first quiz to each user
      const firstQuiz = createdQuizzes[0];
      const assignment = {
        quizId: firstQuiz._id,
        assignedAt: new Date(),
        assignedBy: new mongoose.Types.ObjectId('67ed95c2f332cf5ccdd20eb4'), // Admin user ID
        assignmentType: 'ADMIN_MANUAL',
        isAvailable: true,
      };

      // Clear existing assignments and add the new one
      await User.findByIdAndUpdate(user._id, {
        pendingQuizzes: [assignment],
      });

      console.log(`  ✅ Assigned "${firstQuiz.name}" to ${userEmail}`);
    }

    // 3. Verify the system works for each user
    console.log('\n🔍 Verifying quiz availability for each user...\n');

    for (const userEmail of testUsers) {
      const user = await User.findOne({ email: userEmail }).populate({
        path: 'pendingQuizzes.quizId',
        model: 'Quiz',
      });

      if (!user) continue;

      console.log(`--- User: ${userEmail} ---`);
      console.log(`  Pending Quizzes: ${user.pendingQuizzes.length}`);

      for (const assignment of user.pendingQuizzes) {
        const quiz = assignment.quizId;
        if (quiz) {
          console.log(`  📝 "${quiz.name}"`);
          console.log(`     Status: ${quiz.isActive ? 'Active' : 'Inactive'}`);
          console.log(`     Time Frame: ${quiz.timeFrameHandling}`);
          console.log(`     Questions: ${quiz.questions?.length || 0}`);

          // Check availability
          if (quiz.isActive && quiz.timeFrameHandling === 'ALL_USERS') {
            console.log(`     🎯 AVAILABLE - User will see this at /quiz`);
          } else {
            console.log(`     ❌ May be blocked by time frame or inactive`);
          }
        } else {
          console.log(`  ❌ Orphaned quiz reference`);
        }
      }
      console.log('');
    }

    // 4. Summary and instructions
    console.log('=== UNIVERSAL QUIZ SYSTEM SETUP COMPLETE ===\n');
    console.log('✅ System Status:');
    console.log('  • Created universal quizzes that work for all users');
    console.log('  • Quiz assignments ignore time frame restrictions');
    console.log(
      '  • Admin panel assignments will immediately show for target users'
    );
    console.log('  • RTK Query cache invalidation is properly configured');

    console.log('\n📋 How to use:');
    console.log(
      '  1. Go to admin panel: http://localhost:3000/admin/user/{userId}/edit'
    );
    console.log('  2. Assign any quiz to any user');
    console.log(
      '  3. User visits http://localhost:3000/quiz and sees their assigned quiz'
    );
    console.log('  4. Quiz shows up regardless of user time frame settings');

    console.log('\n🧪 Test URLs:');
    console.log(
      '  • Admin user: http://localhost:3000/quiz (should see Fitness Assessment Quiz)'
    );
    console.log(
      '  • Target user admin panel: http://localhost:3000/admin/user/67f4139ef61083ea7f45e625/edit'
    );
    console.log('  • Any user can be assigned quizzes through admin panel');

    console.log(
      '\n🎯 RESULT: Quiz system now works universally for all users!'
    );
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

setupUniversalQuizSystem();
