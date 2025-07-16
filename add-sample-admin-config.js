// Script to add sample admin config data for testing
// Run this to add sample settings that admins can change

const sampleConfigData = {
  siteName: 'GRINDX FITNESS',
  siteDescription: 'Your premium fitness destination with personalized workouts and nutrition guidance',
  siteKeywords: 'fitness, premium, workouts, nutrition, personal training',
  headerImage: '/images/sample-header.jpg',
  faviconImage: '/favicon-custom.ico',
  colorScheme: {
    primaryColor: '#FF6B35',
    secondaryColor: '#F7931E'
  },
  pwaShortName: 'GRINDX',
  pwaThemeColor: '#FF6B35',
  pwaBackgroundColor: '#ffffff'
};

// Save sample config via API
async function addSampleConfig() {
  console.log('📝 Adding sample admin config data...');
  
  try {
    // First, get user token (you'll need to be logged in as admin)
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    
    if (!userInfo.token) {
      console.error('❌ No admin token found. Please log in as admin first.');
      return;
    }

    const response = await fetch('http://localhost:5000/api/system-settings/general', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userInfo.token}`
      },
      body: JSON.stringify(sampleConfigData)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sample config added successfully:', data);
      console.log('🎉 Now test the new user experience to see these changes!');
      
      // Clear cache so admin can test new user experience
      localStorage.removeItem('STATIC_CONFIG_OVERRIDE');
      localStorage.removeItem('STATIC_CONFIG_API_CACHE');
      
      alert('✅ Sample admin config added! The page will reload to show the changes.');
      window.location.reload();
    } else {
      console.error('❌ Failed to add sample config:', response.status);
    }
  } catch (error) {
    console.error('❌ Error adding sample config:', error);
  }
}

// Auto-expose function for easy access
window.addSampleConfig = addSampleConfig;

console.log('🧪 Sample Config Script Loaded!');
console.log('📝 Run: addSampleConfig() to add sample admin settings');
console.log('⚠️ Make sure you are logged in as admin first!');
