// Debug script for hamburger menu toggle and click-outside behavior
// Run this in browser console to debug menu behavior

function debugMenuBehavior() {
  console.log('🔍 DEBUGGING MENU BEHAVIOR...');
  
  // Check if elements exist
  const hamburger = document.querySelector('.modern-hamburger');
  const dropdown = document.querySelector('.modern-navigation-dropdown');
  const backdrop = document.querySelector('.mobile-menu-backdrop');
  
  console.log('📍 Element Check:');
  console.log('  Hamburger button:', hamburger ? '✅ Found' : '❌ Not found');
  console.log('  Dropdown menu:', dropdown ? '✅ Found' : '❌ Not found');
  console.log('  Mobile backdrop:', backdrop ? '✅ Found' : '❌ Not found');
  
  if (hamburger) {
    console.log('  Hamburger classes:', hamburger.className);
    console.log('  Hamburger aria-expanded:', hamburger.getAttribute('aria-expanded'));
  }
  
  if (dropdown) {
    console.log('  Dropdown classes:', dropdown.className);
    console.log('  Dropdown visible:', getComputedStyle(dropdown).visibility);
    console.log('  Dropdown opacity:', getComputedStyle(dropdown).opacity);
  }
  
  // Test hamburger click
  if (hamburger) {
    console.log('\n🧪 Testing hamburger click...');
    
    // Add a test click listener
    const testClick = (e) => {
      console.log('🍔 TEST: Hamburger clicked!', {
        target: e.target,
        currentTarget: e.currentTarget,
        preventDefault: typeof e.preventDefault,
        stopPropagation: typeof e.stopPropagation,
        ariExpanded: e.target.getAttribute('aria-expanded')
      });
    };
    
    hamburger.addEventListener('click', testClick, true);
    
    console.log('✅ Test listener added. Click the hamburger button now.');
    
    // Clean up after 10 seconds
    setTimeout(() => {
      hamburger.removeEventListener('click', testClick, true);
      console.log('🧹 Test listener removed');
    }, 10000);
  }
  
  // Test click outside
  console.log('\n🧪 Testing click outside behavior...');
  console.log('📝 Instructions:');
  console.log('1. Open the hamburger menu');
  console.log('2. Click anywhere outside the menu');
  console.log('3. Watch console for click outside events');
  
  return {
    hamburger: !!hamburger,
    dropdown: !!dropdown,
    backdrop: !!backdrop,
    isMenuOpen: dropdown ? dropdown.classList.contains('show') : false
  };
}

// Function to monitor all clicks
function monitorClicks() {
  console.log('👀 MONITORING ALL CLICKS...');
  
  const clickMonitor = (e) => {
    console.log('🖱️ CLICK DETECTED:', {
      target: e.target.tagName + (e.target.className ? '.' + e.target.className.split(' ').join('.') : ''),
      isHamburger: e.target.closest('.modern-hamburger') ? 'YES' : 'NO',
      isDropdown: e.target.closest('.modern-navigation-dropdown') ? 'YES' : 'NO',
      isBackdrop: e.target.classList.contains('mobile-menu-backdrop') ? 'YES' : 'NO',
      phase: 'capture',
      timeStamp: e.timeStamp
    });
  };
  
  document.addEventListener('click', clickMonitor, true);
  
  console.log('✅ Click monitor active. All clicks will be logged.');
  console.log('💡 Run stopMonitoring() to stop monitoring.');
  
  // Export stop function
  window.stopMonitoring = () => {
    document.removeEventListener('click', clickMonitor, true);
    console.log('🛑 Click monitoring stopped');
    delete window.stopMonitoring;
  };
}

// Function to test hamburger toggle manually
function testHamburgerToggle() {
  const hamburger = document.querySelector('.modern-hamburger');
  if (!hamburger) {
    console.log('❌ Hamburger button not found');
    return;
  }
  
  console.log('🧪 TESTING HAMBURGER TOGGLE...');
  
  const currentState = hamburger.getAttribute('aria-expanded') === 'true';
  console.log('Current menu state:', currentState ? 'OPEN' : 'CLOSED');
  
  // Simulate click
  hamburger.click();
  
  setTimeout(() => {
    const newState = hamburger.getAttribute('aria-expanded') === 'true';
    console.log('New menu state:', newState ? 'OPEN' : 'CLOSED');
    console.log('Toggle worked:', currentState !== newState ? '✅ YES' : '❌ NO');
  }, 100);
}

// Auto-run debug
debugMenuBehavior();

// Export functions to global scope
window.debugMenuBehavior = debugMenuBehavior;
window.monitorClicks = monitorClicks;
window.testHamburgerToggle = testHamburgerToggle;

console.log('\n🛠️ Available debug functions:');
console.log('  debugMenuBehavior() - Check menu elements and setup');
console.log('  monitorClicks() - Monitor all click events');
console.log('  testHamburgerToggle() - Test hamburger toggle manually');
