import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const BASE_URL = 'http://localhost:5001/api';

async function testCompleteQuizQueue() {
    console.log('🎯 Testing Complete Quiz Queue Flow...\n');

    // Test user credentials
    const email = '123456@email.com';
    const password = '123456';

    try {
        // Step 1: Login
        console.log('1️⃣ Logging in...');
        const loginResponse = await fetch(`${BASE_URL}/users/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`);
        }

        const cookies = loginResponse.headers.get('set-cookie');
        console.log('✅ Login successful');

        // Step 2: Check initial quiz queue
        console.log('\n2️⃣ Checking initial quiz queue...');
        const quizResponse = await fetch(`${BASE_URL}/quiz/active`, {
            headers: {
                'Cookie': cookies
            }
        });

        if (!quizResponse.ok) {
            throw new Error(`Quiz fetch failed: ${quizResponse.status}`);
        }

        const firstQuiz = await quizResponse.json();
        if (!firstQuiz) {
            console.log('❌ No quiz found in queue');
            return;
        }

        console.log(`✅ First quiz: "${firstQuiz.name}"`);
        console.log(`   Questions: ${firstQuiz.questions.length}`);

        // Step 3: Submit first quiz
        console.log('\n3️⃣ Submitting first quiz...');
        const firstAnswers = firstQuiz.questions.map((q, index) => ({
            questionId: q._id,
            answer: q.options[0].text // Always choose first option
        }));

        const submitResponse1 = await fetch(`${BASE_URL}/quiz/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookies
            },
            body: JSON.stringify({
                quizId: firstQuiz._id,
                answers: firstAnswers
            })
        });

        if (!submitResponse1.ok) {
            throw new Error(`First quiz submission failed: ${submitResponse1.status}`);
        }

        const submitResult1 = await submitResponse1.json();
        console.log('✅ First quiz submitted successfully');
        console.log(`   Completion message: "${submitResult1.message}"`);

        // Step 4: Check for second quiz
        console.log('\n4️⃣ Checking for second quiz...');
        const quiz2Response = await fetch(`${BASE_URL}/quiz/active`, {
            headers: {
                'Cookie': cookies
            }
        });

        if (!quiz2Response.ok) {
            throw new Error(`Second quiz fetch failed: ${quiz2Response.status}`);
        }

        const secondQuiz = await quiz2Response.json();
        if (!secondQuiz) {
            console.log('✅ No more quizzes in queue - all completed');
            return;
        }

        console.log(`✅ Second quiz: "${secondQuiz.name}"`);
        console.log(`   Questions: ${secondQuiz.questions.length}`);

        // Step 5: Submit second quiz
        console.log('\n5️⃣ Submitting second quiz...');
        const secondAnswers = secondQuiz.questions.map((q, index) => ({
            questionId: q._id,
            answer: q.options[1].text // Choose second option
        }));

        const submitResponse2 = await fetch(`${BASE_URL}/quiz/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookies
            },
            body: JSON.stringify({
                quizId: secondQuiz._id,
                answers: secondAnswers
            })
        });

        if (!submitResponse2.ok) {
            throw new Error(`Second quiz submission failed: ${submitResponse2.status}`);
        }

        const submitResult2 = await submitResponse2.json();
        console.log('✅ Second quiz submitted successfully');
        console.log(`   Completion message: "${submitResult2.message}"`);

        // Step 6: Check for third quiz
        console.log('\n6️⃣ Checking for third quiz...');
        const quiz3Response = await fetch(`${BASE_URL}/quiz/active`, {
            headers: {
                'Cookie': cookies
            }
        });

        if (!quiz3Response.ok) {
            throw new Error(`Third quiz fetch failed: ${quiz3Response.status}`);
        }

        const thirdQuiz = await quiz3Response.json();
        if (!thirdQuiz) {
            console.log('✅ No more quizzes in queue - all completed');
            return;
        }

        console.log(`✅ Third quiz: "${thirdQuiz.name}"`);
        console.log(`   Questions: ${thirdQuiz.questions.length}`);

        // Step 7: Submit third quiz
        console.log('\n7️⃣ Submitting third quiz...');
        const thirdAnswers = thirdQuiz.questions.map((q, index) => ({
            questionId: q._id,
            answer: q.options[2].text // Choose third option
        }));

        const submitResponse3 = await fetch(`${BASE_URL}/quiz/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookies
            },
            body: JSON.stringify({
                quizId: thirdQuiz._id,
                answers: thirdAnswers
            })
        });

        if (!submitResponse3.ok) {
            throw new Error(`Third quiz submission failed: ${submitResponse3.status}`);
        }

        const submitResult3 = await submitResponse3.json();
        console.log('✅ Third quiz submitted successfully');
        console.log(`   Completion message: "${submitResult3.message}"`);

        // Step 8: Final queue check
        console.log('\n8️⃣ Final queue check...');
        const finalResponse = await fetch(`${BASE_URL}/quiz/active`, {
            headers: {
                'Cookie': cookies
            }
        });

        if (!finalResponse.ok) {
            throw new Error(`Final quiz fetch failed: ${finalResponse.status}`);
        }

        const finalQuiz = await finalResponse.json();
        if (!finalQuiz) {
            console.log('🎉 Queue completely empty - all quizzes completed successfully!');
        } else {
            console.log(`⚠️  Still have quiz: "${finalQuiz.name}"`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testCompleteQuizQueue();
