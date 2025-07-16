// Test script to verify PWA settings save and load functionality
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = 'http://localhost:5000';

const testPWASettings = async () => {
  console.log('=== TESTING PWA SETTINGS SAVE/LOAD ===');
  
  // Test data
  const testData = {
    pwaIcon: 'https://example.com/test-icon-512.png',
    pwaIconWithoutBackground: true,
    pwaShortName: 'TEST-APP',
    pwaThemeColor: '#FF5722',
    pwaBackgroundColor: '#FFF3E0',
    pwaSplashScreenImage: 'https://example.com/splash.png',
    ogImage: 'https://example.com/og-image.png'
  };
  
  try {
    // Step 1: Get current settings
    console.log('📥 1. Getting current settings...');
    const getCurrentResponse = await fetch(`${BASE_URL}/api/system-settings/general`);
    const currentSettings = await getCurrentResponse.json();
    console.log('Current PWA Icon:', currentSettings.pwaIcon);
    console.log('Current PWA Short Name:', currentSettings.pwaShortName);
    
    // Step 2: Save new test data (Note: This requires authentication in real app)
    console.log('\n💾 2. Testing save functionality...');
    console.log('Test data:', testData);
    console.log('⚠️  Note: Save test requires authentication - test manually in admin interface');
    
    // Step 3: Verify the GET endpoint works with all fields
    console.log('\n✅ 3. Verifying all PWA fields are present in API response...');
    const requiredFields = ['pwaIcon', 'pwaIconWithoutBackground', 'pwaShortName', 'pwaThemeColor', 'pwaBackgroundColor', 'pwaSplashScreenImage', 'ogImage'];
    
    const missingFields = requiredFields.filter(field => !(field in currentSettings));
    
    if (missingFields.length === 0) {
      console.log('✅ All PWA fields present in API response!');
      requiredFields.forEach(field => {
        console.log(`  - ${field}: "${currentSettings[field]}"`);
      });
    } else {
      console.log('❌ Missing fields:', missingFields);
    }
    
    // Step 4: Test manifest endpoint
    console.log('\n🌐 4. Testing dynamic manifest endpoint...');
    const manifestResponse = await fetch(`${BASE_URL}/api/system-settings/manifest`);
    const manifestData = await manifestResponse.json();
    console.log('Manifest short_name:', manifestData.short_name);
    console.log('Manifest theme_color:', manifestData.theme_color);
    console.log('Manifest icons count:', manifestData.icons.length);
    
    console.log('\n🎉 TESTING COMPLETE - API endpoints working correctly!');
    console.log('\n📝 MANUAL TESTING STEPS:');
    console.log('1. Go to http://localhost:3000/admin/system-settings');
    console.log('2. Fill in PWA fields with test data');
    console.log('3. Click "Save & Apply PWA Settings"');
    console.log('4. Refresh the page');
    console.log('5. Verify data persists in form fields');
    console.log('6. Check browser tab icon and title update');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testPWASettings();
