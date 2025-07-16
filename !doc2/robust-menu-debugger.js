// ROBUST MENU DEBUGGER v2.0
// Run this in your browser console to debug hamburger menu issues

window.MENU_DEBUG = {
  eventCounts: {
    hamburgerClicks: 0,
    outsideClicks: 0,
    expansions: 0,
    closures: 0
  },
  
  // State tracker
  lastMenuState: null,
  
  // Start monitoring
  startMonitoring: function() {
    console.clear();
    console.log('🔍 ROBUST MENU DEBUGGER v2.0 - STARTING...');
    
    // Reset counters
    this.eventCounts = {
      hamburgerClicks: 0,
      outsideClicks: 0, 
      expansions: 0,
      closures: 0
    };
    
    // Get initial state
    const hamburger = document.querySelector('[data-testid="hamburger-button"]');
    const dropdown = document.querySelector('.modern-navigation-dropdown');
    
    this.lastMenuState = hamburger?.getAttribute('aria-expanded') === 'true';
    console.log(`📊 Initial menu state: ${this.lastMenuState ? 'OPEN' : 'CLOSED'}`);
    
    // 1. Monitor hamburger button
    if (hamburger) {
      console.log('✅ Found hamburger button, attaching monitors');
      
      // Create a wrapper for all events on the hamburger
      const originalClick = hamburger.onclick;
      
      hamburger.onclick = (e) => {
        console.log('🍔 HAMBURGER CLICKED!', {
          timeStamp: new Date().toISOString().split('T')[1].substring(0, 12),
          eventType: e.type,
          target: e.target.tagName,
          defaultPrevented: e.defaultPrevented,
          bubbles: e.bubbles
        });
        
        this.eventCounts.hamburgerClicks++;
        
        // Still call the original handler
        if (originalClick) originalClick.call(hamburger, e);
        
        // Check state after a small delay to ensure it's updated
        setTimeout(() => {
          const newState = hamburger.getAttribute('aria-expanded') === 'true';
          
          // Detect state changes
          if (newState !== this.lastMenuState) {
            console.log(`🔄 Menu state changed: ${this.lastMenuState ? 'OPEN' : 'CLOSED'} → ${newState ? 'OPEN' : 'CLOSED'}`);
            this.lastMenuState = newState;
            
            if (newState) {
              this.eventCounts.expansions++;
            } else {
              this.eventCounts.closures++;
            }
          } else {
            console.log(`⚠️ No state change detected after click! Still ${newState ? 'OPEN' : 'CLOSED'}`);
          }
        }, 50);
      };
    } else {
      console.log('❌ Hamburger button not found!');
    }
    
    // 2. Monitor document clicks for outside click detection
    const originalAddEventListener = document.addEventListener;
    document.addEventListener = function(type, listener, options) {
      if (type === 'mousedown' || type === 'click' || type === 'touchstart') {
        // Create a wrapper function to log before the original handler
        const wrappedListener = function(e) {
          const isHamburger = e.target.closest('[data-testid="hamburger-button"]');
          const isDropdown = e.target.closest('.modern-navigation-dropdown');
          
          if (!isHamburger && !isDropdown) {
            console.log(`👆 OUTSIDE CLICK! (${type})`, {
              timeStamp: new Date().toISOString().split('T')[1].substring(0, 12),
              eventType: e.type,
              target: e.target.tagName,
              phase: e.eventPhase === 1 ? 'CAPTURE' : 'BUBBLE',
              defaultPrevented: e.defaultPrevented
            });
            
            window.MENU_DEBUG.eventCounts.outsideClicks++;
          }
          
          // Call the original listener
          return listener.apply(this, arguments);
        };
        
        // Store the mapping
        if (!window.MENU_DEBUG._listenerMap) window.MENU_DEBUG._listenerMap = new Map();
        window.MENU_DEBUG._listenerMap.set(listener, wrappedListener);
        
        // Call original with our wrapper
        return originalAddEventListener.call(this, type, wrappedListener, options);
      }
      
      return originalAddEventListener.apply(this, arguments);
    };
    
    console.log('✅ Click monitoring active! Try using the menu now...');
    console.log('📋 When done, run window.MENU_DEBUG.stopMonitoring()');
  },
  
  // Stop monitoring and restore original functions
  stopMonitoring: function() {
    console.log('🛑 Stopping menu debugger...');
    
    const hamburger = document.querySelector('[data-testid="hamburger-button"]');
    if (hamburger) hamburger.onclick = null;
    
    if (document.addEventListener !== originalAddEventListener) {
      document.addEventListener = originalAddEventListener;
    }
    
    console.log('📊 EVENT SUMMARY:');
    console.log(`  Hamburger clicks: ${this.eventCounts.hamburgerClicks}`);
    console.log(`  Outside clicks detected: ${this.eventCounts.outsideClicks}`);
    console.log(`  Menu expansions: ${this.eventCounts.expansions}`);
    console.log(`  Menu closures: ${this.eventCounts.closures}`);
    
    console.log('✅ Monitoring stopped.');
  },
  
  // Force menu to close
  forceClose: function() {
    console.log('🔨 Forcing menu to close...');
    
    // Direct DOM manipulation to ensure menu closes
    const dropdown = document.querySelector('.modern-navigation-dropdown');
    if (dropdown) {
      dropdown.classList.remove('show');
      dropdown.style.visibility = 'hidden';
      dropdown.style.opacity = '0';
    }
    
    // Update hamburger state
    const hamburger = document.querySelector('[data-testid="hamburger-button"]');
    if (hamburger) {
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
    
    // Remove backdrop
    const backdrop = document.querySelector('.mobile-menu-backdrop');
    if (backdrop) backdrop.remove();
    
    // Reset body style
    document.body.style.overflow = '';
    
    console.log('✅ Menu forcefully closed.');
  }
};

// Store original for restoration
const originalAddEventListener = document.addEventListener;

// Auto-start monitoring
window.MENU_DEBUG.startMonitoring();

console.log('📋 DEBUG COMMANDS:');
console.log('  window.MENU_DEBUG.startMonitoring() - Start monitoring');
console.log('  window.MENU_DEBUG.stopMonitoring() - Stop monitoring');
console.log('  window.MENU_DEBUG.forceClose() - Force close menu (emergency)');
