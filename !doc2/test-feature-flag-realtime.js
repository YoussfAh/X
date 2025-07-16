// Feature Flag Real-Time Update Test
// This script tests the complete feature flag update flow in real-time

console.log('🚀 Feature Flag Real-Time Update Test');
console.log('='.repeat(50));

let testInterval;
let testCount = 0;
const maxTests = 20; // Run for about 1 minute (3 seconds per test)

function getCurrentUserFeatureFlags() {
  const userInfo = localStorage.getItem('userInfo');
  if (!userInfo) return null;
  
  const parsed = JSON.parse(userInfo);
  return {
    userId: parsed._id,
    email: parsed.email,
    featureFlags: parsed.featureFlags,
    aiAnalysis: parsed.featureFlags?.aiAnalysis,
    uploadMealImage: parsed.featureFlags?.uploadMealImage
  };
}

function checkReduxState() {
  try {
    // Try to access Redux state
    const reduxState = window.store?.getState?.() || window.__REDUX_DEVTOOLS_EXTENSION__.connect().getState();
    return reduxState.auth?.userInfo?.featureFlags;
  } catch (error) {
    return 'Could not access Redux state';
  }
}

function logCurrentState() {
  testCount++;
  console.log(`\n--- Test ${testCount}/${maxTests} ---`);
  console.log('🕐 Time:', new Date().toLocaleTimeString());
  
  const userFlags = getCurrentUserFeatureFlags();
  if (userFlags) {
    console.log('📱 localStorage flags:', userFlags.featureFlags);
    console.log('🧠 AI Analysis:', userFlags.aiAnalysis ? '✅ Enabled' : '❌ Disabled');
    console.log('🍽️ Upload Meal:', userFlags.uploadMealImage ? '✅ Enabled' : '❌ Disabled');
  } else {
    console.log('❌ No user logged in');
  }
  
  const reduxFlags = checkReduxState();
  console.log('🏪 Redux flags:', reduxFlags);
  
  // Check if on AI Analysis page
  if (window.location.pathname === '/ai-analysis') {
    const accessDenied = document.querySelector('[class*="alert-danger"]');
    const hasAccess = !accessDenied || !accessDenied.textContent.includes('Access Denied');
    console.log('🔍 AI Analysis Page Access:', hasAccess ? '✅ Allowed' : '❌ Denied');
    
    // Check for debug panel
    const debugPanel = document.querySelector('h6');
    if (debugPanel && debugPanel.textContent.includes('Debug Information')) {
      console.log('🐛 Debug panel is visible');
    }
  } else {
    console.log('📍 Current page:', window.location.pathname);
  }
}

function startMonitoring() {
  console.log('🎬 Starting real-time monitoring...');
  console.log('📋 Instructions:');
  console.log('1. Keep this console open');
  console.log('2. Go to Admin → User List → Edit your user');
  console.log('3. Toggle the AI Analysis feature flag');
  console.log('4. Save changes');
  console.log('5. Navigate to /ai-analysis');
  console.log('6. Watch the console for updates');
  console.log('');
  
  logCurrentState();
  
  testInterval = setInterval(() => {
    if (testCount >= maxTests) {
      stopMonitoring();
      return;
    }
    logCurrentState();
  }, 3000); // Check every 3 seconds
}

function stopMonitoring() {
  if (testInterval) {
    clearInterval(testInterval);
    testInterval = null;
  }
  console.log('\n🏁 Monitoring stopped');
  console.log('Total tests run:', testCount);
}

function manualCheck() {
  console.log('\n🔍 Manual Check:');
  logCurrentState();
}

async function forceRefreshUserData() {
  console.log('\n🔄 Force refreshing user data...');
  try {
    const response = await fetch('/api/users/refresh-data', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Fresh data received:', data.featureFlags);
      
      // Update localStorage
      const currentUserInfo = JSON.parse(localStorage.getItem('userInfo'));
      const updatedUserInfo = { ...currentUserInfo, featureFlags: data.featureFlags };
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      
      console.log('✅ localStorage updated');
      
      // Trigger a page refresh if needed
      if (window.location.pathname === '/ai-analysis') {
        console.log('🔄 Refreshing AI Analysis page...');
        window.location.reload();
      }
      
    } else {
      console.log('❌ Failed to refresh data:', response.status);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Navigation helpers
function goToAdminEdit() {
  const userInfo = getCurrentUserFeatureFlags();
  if (userInfo) {
    const url = `/admin/user/${userInfo.userId}/edit`;
    console.log('🚀 Navigating to:', url);
    window.location.href = url;
  } else {
    console.log('❌ No user logged in');
  }
}

function goToAIAnalysis() {
  console.log('🧠 Navigating to AI Analysis page...');
  window.location.href = '/ai-analysis?debug=true';
}

// Make functions globally available
window.startFeatureFlagMonitoring = startMonitoring;
window.stopFeatureFlagMonitoring = stopMonitoring;
window.manualFeatureFlagCheck = manualCheck;
window.forceRefreshUserData = forceRefreshUserData;
window.goToAdminEdit = goToAdminEdit;
window.goToAIAnalysis = goToAIAnalysis;

// Auto-start monitoring
startMonitoring();

console.log('\n📋 Available Commands:');
console.log('startFeatureFlagMonitoring() - Start monitoring');
console.log('stopFeatureFlagMonitoring() - Stop monitoring');
console.log('manualFeatureFlagCheck() - Check current state');
console.log('forceRefreshUserData() - Force refresh from server');
console.log('goToAdminEdit() - Go to admin edit page for current user');
console.log('goToAIAnalysis() - Go to AI Analysis page with debug enabled');
