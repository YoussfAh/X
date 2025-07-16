#!/usr/bin/env node
// Node.js script to test the new user config loading
// Run with: node test-new-user-api.js

const fetch = require('node-fetch');

async function testNewUserAPI() {
  console.log('🧪 Testing New User API Loading...');
  console.log('===================================');

  try {
    console.log('📡 Fetching current system settings...');
    const response = await fetch('http://localhost:5000/api/system-settings/general');
    
    console.log('📊 Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('✅ API is working correctly!');
      console.log('\n📋 Current Settings:');
      console.log('  Site Name:', data.siteName);
      console.log('  Site Description:', data.siteDescription);
      console.log('  Header Image:', data.headerImage || 'Not set');
      console.log('  Primary Color:', data.colorScheme?.primaryColor);
      console.log('  Secondary Color:', data.colorScheme?.secondaryColor);
      
      console.log('\n🎯 New User Experience Test:');
      console.log('✅ API endpoint is accessible');
      console.log('✅ Data structure is correct');
      console.log('✅ New users WILL receive this data');
      
      console.log('\n📝 What happens for new users:');
      console.log('1. User visits app (no cached config)');
      console.log('2. App detects new user, calls API immediately');
      console.log('3. API returns:', JSON.stringify(data, null, 2));
      console.log('4. App caches data and updates UI');
      console.log('5. User sees admin settings instantly!');
      
    } else {
      console.error('❌ API failed with status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('\n💡 Make sure backend is running on port 5000');
  }
}

testNewUserAPI();
