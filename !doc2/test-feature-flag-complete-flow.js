// Complete Feature Flag Flow Test
// This script tests the complete feature flag flow from admin update to user experience

console.log('🧪 Testing Complete Feature Flag Flow...\n');

async function testCompleteFlow() {
  console.log('='.repeat(60));
  console.log('🔍 FEATURE FLAG COMPLETE FLOW TEST');
  console.log('='.repeat(60));

  // Test 1: Check current user's feature flags in local storage
  console.log('\n1. 📱 Checking Current User State...');
  const userInfoStr = localStorage.getItem('userInfo');
  if (userInfoStr) {
    const userInfo = JSON.parse(userInfoStr);
    console.log('✅ User logged in:', userInfo.email);
    console.log('🔍 Current feature flags in localStorage:', userInfo.featureFlags);
    console.log('🔍 AI Analysis flag value:', userInfo.featureFlags?.aiAnalysis);
  } else {
    console.log('❌ No user logged in');
    return;
  }

  // Test 2: Check Redux state
  console.log('\n2. 🏪 Checking Redux State...');
  if (window.__REDUX_DEVTOOLS_EXTENSION__) {
    try {
      const reduxState = window.store?.getState?.() || window.__REDUX_DEVTOOLS_EXTENSION__.connect().getState();
      console.log('✅ Redux auth state:', reduxState.auth?.userInfo?.featureFlags);
    } catch (error) {
      console.log('⚠️ Could not access Redux state directly');
    }
  }

  // Test 3: Check if AI Analysis page is accessible
  console.log('\n3. 🧠 Testing AI Analysis Page Access...');
  const currentPath = window.location.pathname;
  if (currentPath === '/ai-analysis') {
    console.log('✅ Currently on AI Analysis page');
    
    // Check if access denied message is showing
    const accessDeniedCard = document.querySelector('h3');
    const accessDeniedAlert = document.querySelector('[class*="alert-danger"]');
    
    if (accessDeniedCard && accessDeniedCard.textContent.includes('AI Analysis Not Available')) {
      console.log('❌ Enhanced access denied message found');
      console.log('🎨 Message style: Enhanced card with features list');
      
      // Check for feature benefits
      const featuresList = document.querySelector('ul.list-unstyled');
      if (featuresList) {
        console.log('✅ Feature benefits list is present');
      }
      
      // Check for "Return Home" button
      const homeButton = document.querySelector('a[href="/"]');
      if (homeButton && homeButton.textContent.includes('Return Home')) {
        console.log('✅ "Return Home" button found');
      } else {
        console.log('⚠️ "Return Home" button not found');
      }
      
      // Check for auto-refresh status
      const autoRefreshText = document.querySelector('small');
      if (autoRefreshText && autoRefreshText.textContent.includes('Auto-checking every 10 seconds')) {
        console.log('✅ Auto-refresh status displayed');
      }
      
    } else if (accessDeniedAlert && accessDeniedAlert.textContent.includes('Access Denied')) {
      console.log('⚠️ Old access denied message found (needs update)');
    } else {
      console.log('✅ AI Analysis page is accessible');
      
      // Check if analysis interface is present
      const analysisInterface = document.querySelector('textarea[placeholder*="analysis"]');
      if (analysisInterface) {
        console.log('✅ Analysis interface is present');
      } else {
        console.log('⚠️ Analysis interface not found');
      }
    }
  } else {
    console.log('ℹ️ Not on AI Analysis page, current path:', currentPath);
  }

  // Test 4: API Test - Get current user data from server
  console.log('\n4. 🌐 Testing Server Data...');
  try {
    const userInfo = JSON.parse(userInfoStr);
    const response = await fetch(`/api/users/${userInfo._id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      const serverUser = await response.json();
      console.log('✅ Server response received');
      console.log('🔍 Server feature flags:', serverUser.featureFlags);
      console.log('🔍 Server AI Analysis flag:', serverUser.featureFlags?.aiAnalysis);
      
      // Compare with local state
      const localFlags = userInfo.featureFlags;
      const serverFlags = serverUser.featureFlags;
      
      if (JSON.stringify(localFlags) === JSON.stringify(serverFlags)) {
        console.log('✅ Local and server feature flags match');
      } else {
        console.log('❌ Local and server feature flags DO NOT match');
        console.log('📱 Local flags:', localFlags);
        console.log('🌐 Server flags:', serverFlags);
      }
    } else {
      console.log('❌ Failed to fetch user data from server:', response.status);
    }
  } catch (error) {
    console.log('❌ Error fetching server data:', error.message);
  }

  // Test 5: Force refresh user data
  console.log('\n5. 🔄 Testing Data Refresh...');
  try {
    const refreshResponse = await fetch('/api/users/refresh-data', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (refreshResponse.ok) {
      const refreshedData = await refreshResponse.json();
      console.log('✅ Data refresh successful');
      console.log('🔍 Refreshed feature flags:', refreshedData.featureFlags);
      
      // Update localStorage with fresh data
      const currentUserInfo = JSON.parse(localStorage.getItem('userInfo'));
      const updatedUserInfo = { ...currentUserInfo, featureFlags: refreshedData.featureFlags };
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      console.log('✅ localStorage updated with fresh feature flags');
    } else {
      console.log('❌ Data refresh failed:', refreshResponse.status);
    }
  } catch (error) {
    console.log('❌ Error refreshing data:', error.message);
  }

  // Test 6: Recommendation
  console.log('\n6. 💡 Recommendations...');
  console.log('To complete the test:');
  console.log('1. Go to Admin → User List');
  console.log('2. Edit the current user');
  console.log('3. Toggle AI Analysis feature flag');
  console.log('4. Save changes');
  console.log('5. Navigate to /ai-analysis');
  console.log('6. Run this test again to verify changes');

  console.log('\n🏁 Test Complete!');
}

// Helper function to force page refresh
function forceRefresh() {
  console.log('🔄 Forcing page refresh...');
  window.location.reload();
}

// Helper function to navigate to AI Analysis page
function goToAIAnalysis() {
  console.log('🧠 Navigating to AI Analysis page...');
  window.location.href = '/ai-analysis?debug=true';
}

// Helper function to navigate to home page
function goToHome() {
  console.log('🏠 Navigating to home page...');
  window.location.href = '/';
}

// Helper function to navigate to admin user edit for current user
function goToEditCurrentUser() {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  if (userInfo) {
    console.log('👤 Navigating to edit current user...');
    window.location.href = `/admin/user/${userInfo._id}/edit`;
  } else {
    console.log('❌ No user logged in');
  }
}

// Make functions available globally
window.testCompleteFlow = testCompleteFlow;
window.forceRefresh = forceRefresh;
window.goToAIAnalysis = goToAIAnalysis;
window.goToHome = goToHome;
window.goToEditCurrentUser = goToEditCurrentUser;

// Run the test
testCompleteFlow();

console.log('\n📋 Available Commands:');
console.log('testCompleteFlow() - Run the complete test again');
console.log('forceRefresh() - Force page refresh');
console.log('goToAIAnalysis() - Navigate to AI Analysis page with debug');
console.log('goToHome() - Navigate to home page');
console.log('goToEditCurrentUser() - Navigate to edit current user');
