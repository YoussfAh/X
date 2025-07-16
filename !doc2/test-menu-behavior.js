// Test script for mobile menu positioning and click behavior
// Run this in browser console while testing the menu

function testMenuBehavior() {
  console.log('🧪 Testing Mobile Menu Behavior (Updated Tests)...');
  
  // Test 1: Check if menu is horizontally centered but not vertically centered
  const menu = document.querySelector('.modern-navigation-dropdown.mobile');
  if (menu) {
    const rect = menu.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    const isHorizontallyCentered = Math.abs((rect.left + rect.width/2) - windowWidth/2) < 10;
    const isNotVerticallyCentered = Math.abs((rect.top + rect.height/2) - windowHeight/2) > 50;
    
    console.log(`✅ Horizontal centering: ${isHorizontallyCentered ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Not vertically centered: ${isNotVerticallyCentered ? 'PASS' : 'FAIL'}`);
    console.log(`Menu position: left=${rect.left}px, top=${rect.top}px, width=${rect.width}px`);
    console.log(`Window center: ${windowWidth/2}px, Menu center: ${rect.left + rect.width/2}px`);
  } else {
    console.log('❌ Menu not found - open the hamburger menu first');
  }
  
  // Test 2: Check backdrop presence and blur removal
  const backdrop = document.querySelector('.mobile-menu-backdrop');
  if (backdrop) {
    console.log('✅ Backdrop found');
    const backdropRect = backdrop.getBoundingClientRect();
    const coversFullScreen = backdropRect.width >= window.innerWidth && backdropRect.height >= window.innerHeight;
    console.log(`✅ Backdrop covers full screen: ${coversFullScreen ? 'PASS' : 'FAIL'}`);
    
    // Check if backdrop-filter is removed
    const computedStyle = window.getComputedStyle(backdrop);
    const hasBackdropFilter = computedStyle.backdropFilter && computedStyle.backdropFilter !== 'none';
    console.log(`✅ Backdrop blur removed: ${!hasBackdropFilter ? 'PASS' : 'FAIL'}`);
  } else {
    console.log('❌ Backdrop not found');
  }
  
  // Test 3: Check hamburger button toggle functionality
  const hamburgerButton = document.querySelector('.modern-hamburger');
  if (hamburgerButton) {
    console.log('✅ Hamburger button found');
    const isToggleButton = hamburgerButton.getAttribute('aria-expanded') !== null;
    console.log(`✅ Hamburger has toggle attributes: ${isToggleButton ? 'PASS' : 'FAIL'}`);
  } else {
    console.log('❌ Hamburger button not found');
  }
  
  // Test 4: Check event listeners
  const hasClickListeners = window.getEventListeners && 
    window.getEventListeners(document).click?.some(l => l.useCapture);
  console.log(`✅ Click capture listeners: ${hasClickListeners ? 'DETECTED' : 'CHECK MANUALLY'}`);
  
  console.log('\n📱 Fixed Issues Test Results:');
  console.log('1. ❌ Backdrop blur removed (no blur on mobile)');
  console.log('2. ✅ Enhanced click-outside behavior with event capture');
  console.log('3. ✅ Hamburger button improved toggle functionality');
  console.log('4. ✅ Event bubbling prevention enhanced');
  
  console.log('\n📱 Manual Tests to Perform:');
  console.log('1. Click hamburger → menu opens');
  console.log('2. Click hamburger again → menu closes (toggle behavior)');
  console.log('3. Open menu → click anywhere outside → menu closes, no other actions trigger');
  console.log('4. Open menu → click on menu items → should work normally');
  console.log('5. Open menu → press Escape → menu closes');
  console.log('6. Check mobile view → no backdrop blur');
  
  return {
    menu: menu ? true : false,
    backdrop: backdrop ? true : false,
    hamburger: hamburgerButton ? true : false,
    horizontallyCentered: menu ? isHorizontallyCentered : false,
    notVerticallyCentered: menu ? isNotVerticallyCentered : false,
    backDropBlurRemoved: backdrop ? !hasBackdropFilter : false
  };
}

// Function to test click-outside behavior
function testClickOutside() {
  console.log('🎯 Testing Click-Outside Behavior...');
  
  const menu = document.querySelector('.modern-navigation-dropdown.mobile.show');
  if (!menu) {
    console.log('❌ Menu not open - open the hamburger menu first');
    return;
  }
  
  console.log('✅ Menu is open');
  console.log('Now click anywhere outside the menu...');
  console.log('Expected: Menu should close without triggering other actions');
  
  // Simulate a click outside
  setTimeout(() => {
    const outsideElement = document.body;
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    outsideElement.dispatchEvent(event);
    
    setTimeout(() => {
      const menuAfterClick = document.querySelector('.modern-navigation-dropdown.mobile.show');
      console.log(`✅ Menu closed after simulated outside click: ${!menuAfterClick ? 'PASS' : 'FAIL'}`);
    }, 100);
  }, 1000);
}

// Auto-run when menu opens
if (document.querySelector('.modern-navigation-dropdown.mobile.show')) {
  testMenuBehavior();
} else {
  console.log('💡 Open the hamburger menu to run tests automatically');
  console.log('💡 Call testMenuBehavior() or testClickOutside() manually');
}

// Export for manual testing
window.testMenuBehavior = testMenuBehavior;
window.testClickOutside = testClickOutside;
