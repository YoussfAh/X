const fetch = require('node-fetch');

async function testUserDataEndpoint() {
    try {
        // Test user endpoint (no userId, should use logged-in user)
        const response = await fetch('http://localhost:5000/api/ai-analysis/user-data?dataTypes=all', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Note: In real usage, cookies would be included automatically
            }
        });

        const data = await response.json();
        console.log('User data response status:', response.status);
        console.log('User data response:');
        console.log('- User:', data.user?.name || 'No user');
        console.log('- Workouts:', data.workouts?.length || 0);
        console.log('- Diet:', data.diet?.length || 0);
        console.log('- Sleep:', data.sleep?.length || 0);
        console.log('- Weight:', data.weight?.length || 0);
        console.log('- Quizzes:', data.quizzes?.length || 0);
        
        if (data.summary) {
            console.log('- Summary found:');
            console.log('  - totalWorkouts:', data.summary.totalWorkouts);
            console.log('  - totalDietEntries:', data.summary.totalDietEntries);
            console.log('  - totalSleepRecords:', data.summary.totalSleepRecords);
            console.log('  - totalWeightRecords:', data.summary.totalWeightRecords);
            console.log('  - completedQuizzes:', data.summary.completedQuizzes);
        } else {
            console.log('- NO SUMMARY FOUND!');
        }
        
    } catch (error) {
        console.error('Error testing user data endpoint:', error);
    }
}

testUserDataEndpoint();
