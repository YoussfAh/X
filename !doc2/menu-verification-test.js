// Menu Verification Test Script
// Run this in your browser console to verify the menu behavior fixes

function verifyMenuFixes() {
  console.log('🔍 Verifying Menu Fixes...');
  
  // 1. Check elements
  const hamburger = document.querySelector('.modern-hamburger');
  const dropdown = document.querySelector('.modern-navigation-dropdown');
  
  console.log('📋 Element Check:');
  console.log('  Hamburger button:', hamburger ? '✅ Found' : '❌ Not found');
  console.log('  Dropdown menu:', dropdown ? '✅ Found' : '❌ Not found');
  
  if (hamburger && dropdown) {
    // 2. Set up monitoring
    console.log('\n📡 Setting up click monitoring...');
    
    // Monitor hamburger clicks
    const originalHamburgerClick = hamburger.onclick;
    hamburger.onclick = function(e) {
      console.log('🍔 MONITORED: Hamburger clicked!');
      console.log('  Target:', e.target);
      console.log('  Current Target:', e.currentTarget);
      console.log('  Type:', e.type);
      console.log('  Timestamp:', new Date().toISOString());
      
      // Call original handler
      if (originalHamburgerClick) originalHamburgerClick.call(this, e);
    };
    
    // Monitor document clicks
    const documentClickHandler = function(e) {
      const isHamburger = e.target.closest('.modern-hamburger');
      const isDropdown = e.target.closest('.modern-navigation-dropdown');
      
      if (!isHamburger && !isDropdown) {
        console.log('🌍 MONITORED: Outside click detected!');
        console.log('  Target:', e.target);
        console.log('  Type:', e.type);
        console.log('  Phase:', e.eventPhase === 1 ? 'CAPTURE' : 'BUBBLE');
      }
    };
    
    // Add capture phase monitoring
    document.addEventListener('click', documentClickHandler, true);
    document.addEventListener('mousedown', documentClickHandler, true);
    
    console.log('✅ Monitoring active! Try these steps:');
    console.log('  1. Click hamburger button → should toggle menu open/closed');
    console.log('  2. With menu open, click anywhere outside → should close menu');
    console.log('  3. Click links in menu → should navigate normally');
    
    // Return cleanup function
    return function cleanup() {
      console.log('🧹 Cleaning up monitors...');
      hamburger.onclick = originalHamburgerClick;
      document.removeEventListener('click', documentClickHandler, true);
      document.removeEventListener('mousedown', documentClickHandler, true);
      console.log('✅ Monitors removed.');
    };
  }
  
  return function() { console.log('Nothing to clean up.'); };
}

// Run verification
const cleanupMonitors = verifyMenuFixes();
console.log('\n💡 When done testing, run: cleanupMonitors()');
