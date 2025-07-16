// Enhanced Access Denied Message Test
// This script specifically tests the improved access denied message and user experience

console.log('🎨 Testing Enhanced Access Denied Message...\n');

function testAccessDeniedMessage() {
  console.log('='.repeat(60));
  console.log('🚫 ENHANCED ACCESS DENIED MESSAGE TEST');
  console.log('='.repeat(60));

  // Check if we're on the AI Analysis page
  if (window.location.pathname !== '/ai-analysis') {
    console.log('⚠️ Not on AI Analysis page. Navigating...');
    window.location.href = '/ai-analysis?debug=true';
    return;
  }

  console.log('✅ On AI Analysis page');

  // Test 1: Check for enhanced access denied message
  console.log('\n1. 🎨 Testing Enhanced Dark Mode Design...');
  
  const enhancedTitle = document.querySelector('h3');
  if (enhancedTitle && enhancedTitle.textContent.includes('AI Analysis Not Available')) {
    console.log('✅ Enhanced title found:', enhancedTitle.textContent);
    
    // Check for dark mode card design
    const card = enhancedTitle.closest('.card');
    if (card) {
      console.log('✅ Card-based design detected');
      
      // Check for dark mode specific styling
      const hasDarkStyling = card.classList.contains('access-denied-card') || 
                            document.querySelector('.access-denied-container');
      if (hasDarkStyling) {
        console.log('✅ Dark mode optimized styling applied');
      } else {
        console.log('⚠️ Basic styling detected - dark mode optimization needed');
      }
      
      // Check for gradient backgrounds
      const hasGradients = document.querySelector('.access-denied-icon-wrapper') ||
                          document.querySelector('.features-box');
      if (hasGradients) {
        console.log('✅ Gradient backgrounds detected');
      } else {
        console.log('⚠️ Basic backgrounds detected');
      }
    } else {
      console.log('⚠️ Card design not detected');
    }
  } else {
    console.log('❌ Enhanced title not found - may be using old design');
  }

  // Test 2: Check for feature benefits list
  console.log('\n2. 📋 Testing Dark Mode Feature Benefits Section...');
  
  const featuresBox = document.querySelector('.features-box');
  if (featuresBox) {
    console.log('✅ Dark mode features box found');
    
    const featureItems = document.querySelectorAll('.feature-item');
    if (featureItems.length > 0) {
      console.log(`✅ Found ${featureItems.length} dark mode styled feature items`);
      
      featureItems.forEach((item, index) => {
        const text = item.textContent.trim();
        console.log(`   ${index + 1}. ${text.substring(0, 60)}...`);
      });
      
      // Check for proper dark mode styling
      const hasProperStyling = featureItems[0].classList.contains('feature-item');
      if (hasProperStyling) {
        console.log('✅ Feature items have dark mode styling');
      }
    } else {
      console.log('⚠️ Feature items not found or not styled');
    }
  } else {
    // Fallback to old design
    const featuresList = document.querySelector('ul.list-unstyled');
    if (featuresList) {
      console.log('⚠️ Old feature benefits list found - needs dark mode update');
      const listItems = featuresList.querySelectorAll('li');
      console.log(`Found ${listItems.length} feature benefits (old style)`);
    } else {
      console.log('❌ Feature benefits section not found');
    }
  }

  // Test 3: Check for Return Home button
  console.log('\n3. 🏠 Testing Dark Mode Return Home Button...');
  
  const homeButton = document.querySelector('a[href="/"]');
  if (homeButton) {
    const buttonText = homeButton.textContent.trim();
    console.log('✅ Return Home button found:', buttonText);
    
    // Check dark mode button styling
    const hasDarkStyling = homeButton.classList.contains('btn-home') ||
                          homeButton.classList.contains('btn-outline-secondary');
    if (hasDarkStyling) {
      console.log('✅ Dark mode button styling applied');
    } else {
      console.log('⚠️ Basic button styling');
    }
  } else {
    console.log('❌ Return Home button not found');
    
    // Check for old dashboard button
    const dashboardButton = document.querySelector('a[href="/dashboard"]');
    if (dashboardButton) {
      console.log('⚠️ Old "Go to Dashboard" button found - needs update');
    }
  }

  // Test 4: Check for Check Access Again button
  console.log('\n4. 🔄 Testing Dark Mode Check Access Button...');
  
  const checkButton = document.querySelector('button');
  if (checkButton) {
    const buttonText = checkButton.textContent.trim();
    console.log('✅ Check button found:', buttonText);
    
    // Check for dark mode styling
    const hasDarkStyling = checkButton.classList.contains('btn-check-access');
    if (hasDarkStyling) {
      console.log('✅ Dark mode check button styling applied');
    } else {
      console.log('⚠️ Basic button styling');
    }
    
    // Check for spinning icon when refreshing
    const spinIcon = checkButton.querySelector('.fa-spin');
    if (spinIcon) {
      console.log('✅ Spinning refresh icon detected');
    } else {
      console.log('ℹ️ Static refresh icon (not currently refreshing)');
    }
  } else {
    console.log('❌ Check Access Again button not found');
  }

  // Test 5: Check for improved status display
  console.log('\n5. 📊 Testing Status Display...');
  
  const statusElements = document.querySelectorAll('small');
  let lastCheckedFound = false;
  let autoRefreshFound = false;
  
  statusElements.forEach(element => {
    const text = element.textContent.trim();
    if (text.includes('Last checked:')) {
      lastCheckedFound = true;
      console.log('✅ Last checked time found:', text);
    }
    if (text.includes('Auto-checking every 10 seconds')) {
      autoRefreshFound = true;
      console.log('✅ Auto-refresh status found:', text);
    }
  });
  
  if (!lastCheckedFound) {
    console.log('⚠️ Last checked time not found');
  }
  if (!autoRefreshFound) {
    console.log('⚠️ Auto-refresh status not found');
  }

  // Test 6: Check for dark mode visual elements
  console.log('\n6. 🌙 Testing Dark Mode Visual Elements...');
  
  // Check for dark mode container
  const darkContainer = document.querySelector('.access-denied-container');
  if (darkContainer) {
    console.log('✅ Dark mode container found');
  } else {
    console.log('⚠️ Dark mode container not found');
  }
  
  // Check for enhanced brain icon
  const iconWrapper = document.querySelector('.access-denied-icon-wrapper');
  const brainIcon = document.querySelector('.text-white svg') || 
                   document.querySelector('svg[data-icon="brain"]') ||
                   document.querySelector('.fa-brain');
  
  if (iconWrapper && brainIcon) {
    console.log('✅ Enhanced dark mode brain icon found');
  } else if (brainIcon) {
    console.log('⚠️ Basic brain icon found - needs dark mode enhancement');
  } else {
    console.log('⚠️ Brain icon not found');
  }
  
  // Check for gradient styling
  const hasGradients = document.querySelector('.access-denied-card') ||
                      document.querySelector('.features-box');
  if (hasGradients) {
    console.log('✅ Gradient styling detected');
  } else {
    console.log('⚠️ Basic styling detected');
  }

  // Test 7: Overall dark mode user experience assessment
  console.log('\n7. � Overall Dark Mode UX Assessment...');
  
  const scores = {
    darkModeDesign: (darkContainer && iconWrapper) ? 1 : 0,
    enhancedFeatures: document.querySelector('.features-box') ? 1 : 0,
    darkModeButtons: (homeButton && checkButton) ? 1 : 0,
    gradientStyling: hasGradients ? 1 : 0,
    statusDisplay: (lastCheckedFound && autoRefreshFound) ? 1 : 0,
    visualElements: (iconWrapper && brainIcon) ? 1 : 0
  };
  
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const maxScore = Object.keys(scores).length;
  const percentage = Math.round((totalScore / maxScore) * 100);
  
  console.log(`🌙 Dark Mode UX Score: ${totalScore}/${maxScore} (${percentage}%)`);
  
  if (percentage >= 90) {
    console.log('🎉 Excellent dark mode experience!');
  } else if (percentage >= 70) {
    console.log('✅ Good dark mode experience');
  } else if (percentage >= 50) {
    console.log('⚠️ Acceptable dark mode experience');
  } else {
    console.log('❌ Poor dark mode experience - needs improvement');
  }

  // Specific dark mode recommendations
  if (percentage < 90) {
    console.log('\n💡 Dark Mode Improvement Suggestions:');
    if (!darkContainer) console.log('   - Add dark mode container styling');
    if (!iconWrapper) console.log('   - Enhance icon styling for dark mode');
    if (!hasGradients) console.log('   - Add gradient backgrounds for depth');
    if (!document.querySelector('.features-box')) console.log('   - Style feature box for dark mode');
  }

  console.log('\n🏁 Enhanced Dark Mode Access Denied Message Test Complete!');
}

// Helper function to simulate checking access
function simulateCheckAccess() {
  const checkButton = document.querySelector('button');
  if (checkButton) {
    console.log('🔄 Simulating check access button click...');
    checkButton.click();
  } else {
    console.log('❌ Check access button not found');
  }
}

// Helper function to test navigation
function testReturnHome() {
  const homeButton = document.querySelector('a[href="/"]');
  if (homeButton) {
    console.log('🏠 Testing Return Home navigation...');
    console.log('✅ Would navigate to:', homeButton.href);
    // Uncomment the next line to actually navigate
    // homeButton.click();
  } else {
    console.log('❌ Return Home button not found');
  }
}

// Make functions globally available
window.testAccessDeniedMessage = testAccessDeniedMessage;
window.simulateCheckAccess = simulateCheckAccess;
window.testReturnHome = testReturnHome;

// Auto-run the test
testAccessDeniedMessage();

console.log('\n📋 Available Commands:');
console.log('testAccessDeniedMessage() - Run the enhanced message test');
console.log('simulateCheckAccess() - Click the check access button');
console.log('testReturnHome() - Test the return home button');
