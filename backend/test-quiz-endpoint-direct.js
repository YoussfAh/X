import fetch from 'node-fetch';

async function testQuizEndpointDirectly() {
    try {
        console.log('🧪 TESTING: Direct API call to quiz endpoint');
        console.log('===============================================');
        
        // First test - check if server is responding
        const serverTest = await fetch('http://localhost:5001/api/test', {
            method: 'GET',
        }).catch(err => {
            console.log('❌ Server not responding on port 5001');
            return null;
        });
        
        if (!serverTest) {
            console.log('❌ Backend server is not accessible');
            console.log('💡 Please ensure backend server is running on port 5001');
            return;
        }
        
        // Test login with target user
        console.log('\n1. 🔐 Testing login with target user...');
        const loginResponse = await fetch('http://localhost:5001/api/users/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: '123456@email.com',
                password: '123456'
            })
        });
        
        if (!loginResponse.ok) {
            console.log('❌ Login failed - server may not be connected to correct database');
            console.log(`Status: ${loginResponse.status}`);
            const errorText = await loginResponse.text();
            console.log(`Error: ${errorText}`);
            return;
        }
        
        const loginData = await loginResponse.json();
        console.log('✅ Login successful');
        console.log(`User: ${loginData.email}`);
        
        // Extract token properly - check different possible formats
        let token = loginData.token || loginData.accessToken || loginData.access_token;
        
        if (!token) {
            console.log('❌ No token found in login response');
            console.log('Login response keys:', Object.keys(loginData));
            return;
        }
        
        console.log(`Token type: ${typeof token}`);
        console.log(`Token length: ${token.length}`);
        console.log(`Token starts with: ${token.substring(0, 10)}...`);
        
        // Test quiz endpoint
        console.log('\n2. 📝 Testing quiz endpoint...');
        const quizResponse = await fetch('http://localhost:5001/api/quiz/active-for-user', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
        
        if (!quizResponse.ok) {
            console.log('❌ Quiz endpoint failed');
            console.log(`Status: ${quizResponse.status}`);
            const errorText = await quizResponse.text();
            console.log(`Error: ${errorText}`);
            return;
        }
        
        const quizData = await quizResponse.json();
        
        console.log('\n🎯 QUIZ ENDPOINT RESULT:');
        if (quizData) {
            console.log('✅ SUCCESS: Quiz returned!');
            console.log(`Quiz Name: "${quizData.name}"`);
            console.log(`Questions: ${quizData.questions?.length || 0}`);
            console.log(`Quiz ID: ${quizData._id}`);
            console.log(`Active: ${quizData.isActive}`);
            console.log(`TimeFrame: ${quizData.timeFrameHandling}`);
        } else {
            console.log('❌ No quiz returned (null response)');
            console.log('This means either:');
            console.log('  - User has no pending quizzes');
            console.log('  - Quiz controller filtering is still active');
            console.log('  - Database connection issues');
        }
        
        console.log('\n📊 SUMMARY:');
        console.log(`✅ Server accessible: YES`);
        console.log(`✅ User login: ${loginData ? 'SUCCESS' : 'FAILED'}`);
        console.log(`✅ Quiz endpoint: ${quizResponse.ok ? 'ACCESSIBLE' : 'FAILED'}`);
        console.log(`✅ Quiz returned: ${quizData ? 'YES' : 'NO'}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n💡 Troubleshooting steps:');
        console.log('1. Check if backend server is running');
        console.log('2. Verify MongoDB connection');
        console.log('3. Confirm target user exists in database');
        console.log('4. Check server logs for errors');
    }
}

// Only run if node-fetch is available
try {
    testQuizEndpointDirectly();
} catch (error) {
    console.log('❌ node-fetch not available. Install with: npm install node-fetch');
}
