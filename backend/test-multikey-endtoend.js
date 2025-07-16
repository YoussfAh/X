// Test script to verify multi-API key system end-to-end
console.log('🧪 Starting Multi-API Key System End-to-End Test');

// Test function to simulate AI analysis request
async function testAIAnalysis() {
    try {
        console.log('\n1️⃣ Testing AI Analysis Endpoint...');
        
        // First we need to login to get a token
        const loginResponse = await fetch('http://localhost:5000/api/users/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@email.com', // Try admin user
                password: 'admin123' // Common admin password
            })
        });
        
        if (!loginResponse.ok) {
            console.error('❌ Login failed. Status:', loginResponse.status);
            const errorText = await loginResponse.text();
            console.error('Error:', errorText);
            return;
        }
        
        const loginData = await loginResponse.json();
        console.log('✅ Login successful');
        
        const token = loginData.token;
        
        // Test AI analysis with the token
        console.log('\n2️⃣ Making AI Analysis Request...');
        const analysisResponse = await fetch('http://localhost:5000/api/ai-analysis/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                dataTypes: ['meals', 'workouts', 'progress'],
                dateRange: {
                    startDate: '2024-06-01',
                    endDate: '2024-07-06'
                }
            })
        });
        
        if (!analysisResponse.ok) {
            console.error('❌ AI Analysis failed. Status:', analysisResponse.status);
            const errorText = await analysisResponse.text();
            console.error('Error:', errorText);
            return;
        }
        
        const analysisData = await analysisResponse.json();
        console.log('✅ AI Analysis successful!');
        console.log('Response:', JSON.stringify(analysisData, null, 2));
        
        // Test service status endpoint
        console.log('\n3️⃣ Testing AI Service Status...');
        const statusResponse = await fetch('http://localhost:5000/api/ai-analysis/service-status', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('✅ Service Status retrieved!');
            console.log('Status:', JSON.stringify(statusData, null, 2));
        } else {
            console.log('⚠️ Service status endpoint not accessible');
        }
        
        console.log('\n🎉 Multi-API Key System Test Complete!');
        
    } catch (error) {
        console.error('💥 Test failed with error:', error);
    }
}

// Run the test
testAIAnalysis();
