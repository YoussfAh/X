// Simple Hamburger Menu Test Script
// Run this in browser console to verify menu toggle behavior

(function() {
  console.clear();
  console.log('🍔 SIMPLE HAMBURGER MENU TESTER');
  console.log('--------------------------------');
  
  // Get elements
  const hamburger = document.querySelector('[data-testid="hamburger-button"]') || 
                    document.querySelector('.modern-hamburger');
  
  if (!hamburger) {
    console.log('❌ ERROR: Hamburger button not found!');
    return;
  }
  
  console.log('✅ Found hamburger button');
  
  // Test toggle function
  let toggleCount = 0;
  let openCount = 0;
  let closeCount = 0;
  
  // Create a simple click monitor
  function monitorHamburgerClicks() {
    const originalClick = hamburger.onclick;
    
    hamburger.onclick = function(e) {
      toggleCount++;
      
      // Log click
      const isOpen = hamburger.classList.contains('open');
      console.log(`🍔 Hamburger clicked (${toggleCount})! Current state:`, isOpen ? 'OPEN' : 'CLOSED');
      
      // Call original handler
      if (originalClick) originalClick.call(this, e);
      
      // Check state after click
      setTimeout(() => {
        const newState = hamburger.classList.contains('open');
        console.log(`   → New state:`, newState ? 'OPEN' : 'CLOSED');
        
        if (newState !== isOpen) {
          console.log(`   ✅ TOGGLE SUCCESSFUL!`);
          newState ? openCount++ : closeCount++;
        } else {
          console.log(`   ❌ TOGGLE FAILED - state did not change!`);
        }
        
        console.log(`   📊 Stats: ${openCount} opens, ${closeCount} closes`);
      }, 100);
    };
    
    console.log('✅ Click monitoring active! Try clicking the hamburger button multiple times.');
    console.log('');
    console.log('📋 To test:');
    console.log('1. Click hamburger → menu should open');
    console.log('2. Click hamburger again → menu should close');
    console.log('3. Repeat several times to verify consistent behavior');
  }
  
  // Start monitoring
  monitorHamburgerClicks();
})();
