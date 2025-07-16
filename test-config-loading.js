// Test script to debug config loading
// Run this in browser console to test config loading

console.log('🧪 TESTING CONFIG LOADING...');

// 1. Clear all cache to simulate new user
localStorage.removeItem('STATIC_CONFIG_OVERRIDE');
localStorage.removeItem('STATIC_CONFIG_API_CACHE');
console.log('✅ Cleared all cache');

// 2. Test API endpoint directly
fetch('/api/system-settings/general')
  .then(response => {
    console.log('📡 API Response Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('📦 API Data Received:', data);
    console.log('🏷️ Site Name from API:', data.siteName);
    console.log('🎨 Color Scheme from API:', data.colorScheme);
    console.log('🖼️ Header Image from API:', data.headerImage);
  })
  .catch(error => {
    console.error('❌ API Error:', error);
  });

// 3. Test getActiveConfig function
import { getActiveConfig } from './src/config/staticAppConfig.js';
getActiveConfig().then(config => {
  console.log('⚙️ getActiveConfig Result:', config);
  console.log('🏷️ Site Name:', config.siteName);
}).catch(error => {
  console.error('❌ getActiveConfig Error:', error);
});

console.log('🧪 Test complete - check results above');
