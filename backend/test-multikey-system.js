import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Import the AI service
import aiService from './utils/aiService.js';

async function testMultiKeySystem() {
    console.log('🔍 Testing Multi-Key AI System');
    console.log('=' .repeat(50));
    
    try {
        // Test 1: Get service status
        console.log('\n1️⃣ Testing Service Status...');
        const status = aiService.getStatus();
        console.log('Service Status:', JSON.stringify(status, null, 2));
        
        // Test 2: Test all keys
        console.log('\n2️⃣ Testing All API Keys...');
        const keyTest = await aiService.testAllKeys();
        console.log('Key Test Results:', JSON.stringify(keyTest, null, 2));
        
        // Test 3: Try a simple AI content generation
        console.log('\n3️⃣ Testing AI Content Generation...');
        const testPrompt = "Analyze this simple fitness data and provide a brief summary. Keep it under 100 words: User exercised for 30 minutes of cardio and ate 300 calories for breakfast.";
        
        const analysis = await aiService.generateContent(testPrompt);
        console.log('Analysis Result:', analysis);
        
        console.log('\n✅ Multi-key system test completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Error during testing:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testMultiKeySystem().then(() => {
    console.log('\n🏁 Test completed. Exiting...');
    process.exit(0);
}).catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
});
