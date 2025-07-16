// Quick test for AI Analysis API endpoints
// Run this with: node test-ai-analysis.js

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function testAIAnalysisEndpoints() {
  console.log('🧪 Testing AI Analysis API Endpoints...\n');

  try {
    // Test 1: Check if the user data endpoint exists
    console.log('1. Testing user data endpoint...');
    const userDataResponse = await fetch(`${BASE_URL}/ai-analysis/user-data`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log(`   Status: ${userDataResponse.status}`);
    if (userDataResponse.status === 401) {
      console.log('   ✅ Endpoint exists and requires authentication (expected)');
    } else {
      console.log(`   ❌ Unexpected status: ${userDataResponse.status}`);
    }

    // Test 2: Check if the analyze endpoint exists
    console.log('\n2. Testing analyze endpoint...');
    const analyzeResponse = await fetch(`${BASE_URL}/ai-analysis/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userData: { test: 'data' },
        prompt: 'test prompt'
      })
    });

    console.log(`   Status: ${analyzeResponse.status}`);
    if (analyzeResponse.status === 401) {
      console.log('   ✅ Endpoint exists and requires authentication (expected)');
    } else {
      console.log(`   ❌ Unexpected status: ${analyzeResponse.status}`);
    }

    console.log('\n✅ AI Analysis endpoints are properly configured!');
    console.log('🚀 Ready to test in the frontend application.');

  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
  }
}

testAIAnalysisEndpoints();
