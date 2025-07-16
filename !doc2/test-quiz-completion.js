// Test script to verify quiz completion functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/quiz';

// Test function to check quiz completion flow
async function testQuizCompletion() {
  try {
    console.log('🧪 Testing Quiz Completion Flow...\n');

    // 1. Get active quiz for user
    console.log('1. Getting active quiz...');
    const activeQuizResponse = await axios.get(`${BASE_URL}/active-for-user`, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE', // You'll need to replace this
        'Content-Type': 'application/json'
      }
    });
    
    if (activeQuizResponse.data) {
      console.log('✅ Active quiz found:', activeQuizResponse.data.title);
      console.log('   Completion Message:', activeQuizResponse.data.completionMessage);
      console.log('   Questions:', activeQuizResponse.data.questions.length);
    } else {
      console.log('❌ No active quiz found');
      return;
    }

    // 2. Test quiz submission (you'll need to provide real answers)
    const sampleAnswers = [
      { questionId: 'QUESTION_ID_1', optionId: 'OPTION_ID_1' },
      { questionId: 'QUESTION_ID_2', textAnswer: 'Sample text answer' }
    ];

    console.log('\n2. Testing quiz submission...');
    const submitResponse = await axios.post(`${BASE_URL}/${activeQuizResponse.data._id}/submit`, {
      answers: sampleAnswers
    }, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Quiz submitted successfully');
    console.log('   Response:', submitResponse.data);
    console.log('   Completion Message:', submitResponse.data.completionMessage);

  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else {
      console.error('   Error:', error.message);
    }
  }
}

// Run the test
testQuizCompletion();
