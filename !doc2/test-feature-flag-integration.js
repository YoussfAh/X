// Complete Feature Flag Integration Test
// This script provides a comprehensive test of the feature flag system

console.log('🚀 Complete Feature Flag Integration Test');
console.log('='.repeat(60));

class FeatureFlagTester {
  constructor() {
    this.currentUser = this.getCurrentUser();
    this.testResults = {};
    this.isMonitoring = false;
    this.monitorInterval = null;
  }

  getCurrentUser() {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  }

  async testBackendConnection() {
    console.log('\n1. 🌐 Testing Backend Connection...');
    
    if (!this.currentUser) {
      console.log('❌ No user logged in');
      return false;
    }

    try {
      // Test getting current user data
      const response = await fetch(`/api/users/${this.currentUser._id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Backend connection successful');
        console.log('📊 Server feature flags:', userData.featureFlags);
        this.testResults.backendConnection = true;
        return userData;
      } else {
        console.log('❌ Backend connection failed:', response.status);
        this.testResults.backendConnection = false;
        return false;
      }
    } catch (error) {
      console.log('❌ Backend error:', error.message);
      this.testResults.backendConnection = false;
      return false;
    }
  }

  async testFeatureFlagUpdate(flagName, newValue) {
    console.log(`\n2. 🚩 Testing Feature Flag Update (${flagName}: ${newValue})...`);
    
    if (!this.currentUser) {
      console.log('❌ No user logged in');
      return false;
    }

    try {
      const updateData = {
        _id: this.currentUser._id,
        featureFlags: {
          ...this.currentUser.featureFlags,
          [flagName]: newValue
        }
      };

      const response = await fetch(`/api/users/${this.currentUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Feature flag update successful');
        console.log('📊 Updated feature flags:', result.featureFlags);
        
        // Update localStorage
        const updatedUser = { ...this.currentUser, featureFlags: result.featureFlags };
        localStorage.setItem('userInfo', JSON.stringify(updatedUser));
        this.currentUser = updatedUser;
        
        this.testResults.featureFlagUpdate = true;
        return result;
      } else {
        console.log('❌ Feature flag update failed:', response.status);
        this.testResults.featureFlagUpdate = false;
        return false;
      }
    } catch (error) {
      console.log('❌ Update error:', error.message);
      this.testResults.featureFlagUpdate = false;
      return false;
    }
  }

  testFrontendState() {
    console.log('\n3. 🖥️ Testing Frontend State...');
    
    // Check localStorage
    const localUser = this.getCurrentUser();
    console.log('📱 localStorage flags:', localUser?.featureFlags);
    
    // Check Redux state (if available)
    try {
      const reduxState = window.store?.getState?.();
      if (reduxState) {
        console.log('🏪 Redux flags:', reduxState.auth?.userInfo?.featureFlags);
        this.testResults.frontendState = true;
      } else {
        console.log('⚠️ Redux state not accessible');
        this.testResults.frontendState = false;
      }
    } catch (error) {
      console.log('⚠️ Could not access Redux state');
      this.testResults.frontendState = false;
    }
  }

  testPageAccess() {
    console.log('\n4. 🔐 Testing Page Access...');
    
    const currentPath = window.location.pathname;
    console.log('📍 Current page:', currentPath);
    
    if (currentPath === '/ai-analysis') {
      const accessDenied = document.querySelector('h4');
      const hasAccess = !accessDenied || !accessDenied.textContent.includes('Access Denied');
      
      console.log('🧠 AI Analysis Access:', hasAccess ? '✅ Allowed' : '❌ Denied');
      
      if (hasAccess) {
        const analysisInterface = document.querySelector('textarea');
        console.log('📝 Analysis Interface:', analysisInterface ? '✅ Present' : '❌ Missing');
      }
      
      this.testResults.pageAccess = hasAccess;
    } else {
      console.log('ℹ️ Not on AI Analysis page');
      this.testResults.pageAccess = null;
    }
  }

  async runCompleteTest() {
    console.log('🎬 Running Complete Integration Test...');
    
    // Test 1: Backend Connection
    const backendData = await this.testBackendConnection();
    
    // Test 2: Frontend State
    this.testFrontendState();
    
    // Test 3: Page Access
    this.testPageAccess();
    
    // Test 4: Feature Flag Toggle (if admin)
    if (this.currentUser?.isAdmin && backendData) {
      const currentAiFlag = backendData.featureFlags?.aiAnalysis;
      console.log(`\n5. 🔄 Testing Feature Flag Toggle (AI Analysis: ${currentAiFlag})...`);
      
      // Toggle the flag
      const newValue = !currentAiFlag;
      await this.testFeatureFlagUpdate('aiAnalysis', newValue);
      
      // Wait a moment then toggle back
      setTimeout(async () => {
        console.log('\n6. 🔄 Toggling back to original value...');
        await this.testFeatureFlagUpdate('aiAnalysis', currentAiFlag);
        this.showResults();
      }, 2000);
    } else {
      this.showResults();
    }
  }

  showResults() {
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('='.repeat(40));
    
    Object.entries(this.testResults).forEach(([test, result]) => {
      const status = result === true ? '✅ PASS' : 
                    result === false ? '❌ FAIL' : 
                    '⚠️ SKIP';
      console.log(`${test.padEnd(20)}: ${status}`);
    });
    
    const passed = Object.values(this.testResults).filter(r => r === true).length;
    const total = Object.values(this.testResults).filter(r => r !== null).length;
    
    console.log(`\n🏆 Score: ${passed}/${total} tests passed`);
  }

  startRealtimeMonitoring() {
    console.log('\n👁️ Starting Real-time Monitoring...');
    this.isMonitoring = true;
    
    this.monitorInterval = setInterval(() => {
      if (!this.isMonitoring) return;
      
      const timestamp = new Date().toLocaleTimeString();
      const user = this.getCurrentUser();
      
      console.log(`[${timestamp}] AI Analysis: ${user?.featureFlags?.aiAnalysis ? '✅' : '❌'} | Upload: ${user?.featureFlags?.uploadMealImage ? '✅' : '❌'}`);
    }, 5000);
    
    console.log('🔄 Monitoring every 5 seconds. Call stopMonitoring() to stop.');
  }

  stopMonitoring() {
    console.log('\n🛑 Stopping monitoring...');
    this.isMonitoring = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  async refreshData() {
    console.log('\n🔄 Refreshing user data from server...');
    try {
      const response = await fetch('/api/users/refresh-data', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('userInfo', JSON.stringify(data));
        this.currentUser = data;
        console.log('✅ Data refreshed successfully');
        console.log('🚩 Current flags:', data.featureFlags);
        return data;
      } else {
        console.log('❌ Refresh failed:', response.status);
        return false;
      }
    } catch (error) {
      console.log('❌ Refresh error:', error.message);
      return false;
    }
  }

  // Navigation helpers
  goToAIAnalysis() {
    window.location.href = '/ai-analysis?debug=true';
  }

  goToAdminEdit() {
    if (this.currentUser) {
      window.location.href = `/admin/user/${this.currentUser._id}/edit`;
    } else {
      console.log('❌ No user logged in');
    }
  }
}

// Create global instance
const tester = new FeatureFlagTester();

// Make methods globally available
window.featureFlagTester = tester;
window.runCompleteFeatureFlagTest = () => tester.runCompleteTest();
window.startFeatureFlagMonitoring = () => tester.startRealtimeMonitoring();
window.stopFeatureFlagMonitoring = () => tester.stopMonitoring();
window.refreshFeatureFlagData = () => tester.refreshData();
window.goToAIAnalysisTest = () => tester.goToAIAnalysis();
window.goToAdminEditTest = () => tester.goToAdminEdit();

// Auto-run the complete test
tester.runCompleteTest();

console.log('\n📋 Available Commands:');
console.log('runCompleteFeatureFlagTest() - Run full integration test');
console.log('startFeatureFlagMonitoring() - Start real-time monitoring');
console.log('stopFeatureFlagMonitoring() - Stop monitoring');
console.log('refreshFeatureFlagData() - Refresh from server');
console.log('goToAIAnalysisTest() - Navigate to AI Analysis with debug');
console.log('goToAdminEditTest() - Navigate to admin edit page');
