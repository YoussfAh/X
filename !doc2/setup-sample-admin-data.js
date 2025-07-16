// Quick script to add sample admin settings to test new user experience
// Run this in the browser console while logged in as admin

(async function addSampleAdminSettings() {
  console.log('🚀 Adding sample admin settings for testing...');
  
  // Sample admin config that will be visible to new users
  const sampleConfig = {
    siteName: 'GRINDX PRO FITNESS',
    siteDescription: 'Premium fitness platform with advanced workout tracking and nutrition guidance',
    siteKeywords: 'premium fitness, workout tracking, nutrition, personal training, grindx pro',
    headerImage: '/images/custom-header-logo.png',
    faviconImage: '/favicon-custom.ico',
    colorScheme: {
      primaryColor: '#FF6B35',   // Orange
      secondaryColor: '#F7931E'  // Golden orange
    },
    pwaShortName: 'GRINDX PRO',
    pwaThemeColor: '#FF6B35',
    pwaBackgroundColor: '#ffffff'
  };

  try {
    // Get admin token
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    
    if (!userInfo.token) {
      console.error('❌ Please login as admin first!');
      alert('Please login as admin first!');
      return;
    }

    // Save to API
    const response = await fetch('http://localhost:5000/api/system-settings/general', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userInfo.token}`
      },
      body: JSON.stringify(sampleConfig)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sample admin settings saved successfully!');
      console.log('📋 Settings:', data);
      
      // Clear any existing cache so we can test properly
      localStorage.removeItem('STATIC_CONFIG_OVERRIDE');
      localStorage.removeItem('STATIC_CONFIG_API_CACHE');
      
      console.log('🧪 Cache cleared - now test new user experience!');
      console.log('🔄 Refreshing page to show changes...');
      
      alert('✅ Sample admin settings added! Page will refresh to show changes.');
      window.location.reload();
      
    } else {
      console.error('❌ Failed to save settings:', response.status, response.statusText);
      alert('Failed to save settings. Make sure you are logged in as admin.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error: ' + error.message);
  }
})();

console.log('📝 Sample admin settings script loaded!');
console.log('🚀 Auto-running... make sure you are logged in as admin!');
