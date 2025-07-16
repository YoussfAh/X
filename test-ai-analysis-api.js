// Test script to debug the AI analysis API
const fetch = require('node-fetch');

async function testAiAnalysisAPI() {
    const baseUrl = 'http://localhost:5000/api/ai-analysis/user-data';
    
    console.log('=== Testing AI Analysis API ===\n');
    
    // Test 1: All data (this works on frontend)
    console.log('1. Testing with dataTypes=all');
    try {
        const response1 = await fetch(`${baseUrl}?dataTypes=all`, {
            credentials: 'include'
        });
        const data1 = await response1.json();
        console.log('Status:', response1.status);
        console.log('Response:', data1.message || 'Success');
        if (data1.summary) {
            console.log('Summary counts:', {
                workouts: data1.summary.totalWorkouts,
                diet: data1.summary.totalDietEntries,
                sleep: data1.summary.totalSleepRecords,
                weight: data1.summary.totalWeightRecords,
                quizzes: data1.summary.completedQuizzes
            });
        }
    } catch (error) {
        console.log('Error:', error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Individual data types (this fails on frontend)
    console.log('2. Testing with dataTypes=workouts');
    try {
        const response2 = await fetch(`${baseUrl}?dataTypes=workouts`, {
            credentials: 'include'
        });
        const data2 = await response2.json();
        console.log('Status:', response2.status);
        console.log('Response:', data2.message || 'Success');
        if (data2.summary) {
            console.log('Summary counts:', {
                workouts: data2.summary.totalWorkouts,
                diet: data2.summary.totalDietEntries,
                sleep: data2.summary.totalSleepRecords,
                weight: data2.summary.totalWeightRecords,
                quizzes: data2.summary.completedQuizzes
            });
        }
    } catch (error) {
        console.log('Error:', error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Multiple data types
    console.log('3. Testing with dataTypes=workouts,diet');
    try {
        const response3 = await fetch(`${baseUrl}?dataTypes=workouts,diet`, {
            credentials: 'include'
        });
        const data3 = await response3.json();
        console.log('Status:', response3.status);
        console.log('Response:', data3.message || 'Success');
        if (data3.summary) {
            console.log('Summary counts:', {
                workouts: data3.summary.totalWorkouts,
                diet: data3.summary.totalDietEntries,
                sleep: data3.summary.totalSleepRecords,
                weight: data3.summary.totalWeightRecords,
                quizzes: data3.summary.completedQuizzes
            });
        }
    } catch (error) {
        console.log('Error:', error.message);
    }
}

testAiAnalysisAPI();
