import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const BASE_URL = 'http://localhost:5001/api';

async function quickLoginAndQuizTest() {
    console.log('🔍 Quick Login and Quiz Test...\n');

    try {
        // Login
        console.log('Logging in...');
        const loginResponse = await fetch(`${BASE_URL}/users/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                email: '123456@email.com', 
                password: '123456' 
            })
        });

        if (!loginResponse.ok) {
            const errorText = await loginResponse.text();
            console.log('❌ Login failed:', loginResponse.status, errorText);
            return;
        }

        const cookies = loginResponse.headers.get('set-cookie');
        console.log('✅ Login successful');
        console.log('🍪 Cookies:', cookies?.substring(0, 100) + '...');

        // Test quiz endpoint
        console.log('\nTesting quiz endpoint...');
        const quizResponse = await fetch(`${BASE_URL}/quiz/active`, {
            headers: {
                'Cookie': cookies
            }
        });

        console.log('📊 Quiz Response Status:', quizResponse.status);
        
        if (!quizResponse.ok) {
            const errorText = await quizResponse.text();
            console.log('❌ Quiz fetch error:', errorText);
            return;
        }

        const quiz = await quizResponse.json();
        console.log('✅ Quiz fetch successful');
        console.log('📝 Quiz data:', JSON.stringify(quiz, null, 2));

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

quickLoginAndQuizTest();
