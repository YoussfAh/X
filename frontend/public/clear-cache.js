// Clear browser cache and storage script
(function() {
  console.log('🧹 Clearing browser cache and storage...');
  
  try {
    // Clear localStorage except for essential items
    const essentialKeys = ['theme', 'deviceId'];
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!essentialKeys.includes(key)) {
        keysToRemove.push(key);
      }
      //
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log('Removed from localStorage:', key);
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    console.log('✅ SessionStorage cleared');
    
    // Clear service worker cache if available
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
          console.log('Deleted cache:', name);
        });
      });
    }
    
    console.log('✅ Cache clearing complete');
    console.log('Please refresh the page to continue');
    
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
})(); 