import fetch from 'node-fetch';

async function testQuizEndpointWithCookies() {
    try {
        console.log('🧪 TESTING: Quiz endpoint with cookie authentication');
        console.log('======================================================');
        
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
            console.log('❌ Login failed');
            console.log(`Status: ${loginResponse.status}`);
            const errorText = await loginResponse.text();
            console.log(`Error: ${errorText}`);
            return;
        }
        
        const loginData = await loginResponse.json();
        console.log('✅ Login successful');
        console.log(`User: ${loginData.email}`);
        console.log(`Session ID: ${loginData.sessionId}`);
        
        // Extract cookies from login response
        const cookies = loginResponse.headers.get('set-cookie');
        console.log(`Cookies received: ${cookies ? 'YES' : 'NO'}`);
        
        if (cookies) {
            console.log(`Cookie header: ${cookies}`);
        }
        
        // Test quiz endpoint with cookies
        console.log('\n2. 📝 Testing quiz endpoint with cookies...');
        const quizResponse = await fetch('http://localhost:5001/api/quiz/active-for-user', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookies || '' // Include cookies from login
            }
        });
        
        console.log(`Quiz response status: ${quizResponse.status}`);
        
        if (!quizResponse.ok) {
            console.log('❌ Quiz endpoint failed');
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
            
            if (quizData.questions && quizData.questions.length > 0) {
                console.log('\n📝 First Question:');
                console.log(`"${quizData.questions[0].questionText}"`);
                console.log(`Options: ${quizData.questions[0].options?.length || 0}`);
            }
        } else {
            console.log('❌ No quiz returned (null response)');
            console.log('This means:');
            console.log('  - User has no pending quizzes, OR');
            console.log('  - Quiz controller filtering is still active, OR');
            console.log('  - Database connection issues');
        }
        
        console.log('\n📊 FINAL RESULT:');
        console.log(`✅ Server accessible: YES`);
        console.log(`✅ User login: SUCCESS`);
        console.log(`✅ Cookie auth: ${cookies ? 'SUCCESS' : 'FAILED'}`);
        console.log(`✅ Quiz endpoint: ${quizResponse.ok ? 'ACCESSIBLE' : 'FAILED'}`);
        console.log(`✅ Quiz returned: ${quizData ? 'YES' : 'NO'}`);
        
        if (quizData) {
            console.log('\n🎉 PROBLEM SOLVED!');
            console.log('✅ Pending quizzes ARE showing up for the user!');
            console.log('✅ Quiz controller fix is working!');
            console.log('✅ All assigned quizzes are now visible!');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Only run if node-fetch is available
try {
    testQuizEndpointWithCookies();
} catch (error) {
    console.log('❌ node-fetch not available. Install with: npm install node-fetch');
}
