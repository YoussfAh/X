// PWA Installation Debug Utility
// Add this to check PWA installation readiness

function checkPWAReadiness() {
  console.log('=== PWA Installation Readiness Check ===');
  
  // Check if already installed
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOSStandalone = window.navigator.standalone === true;
  console.log('Already installed:', isStandalone || isIOSStandalone);
  
  // Check service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log('Service workers registered:', registrations.length);
      registrations.forEach((reg, i) => {
        console.log(`SW ${i + 1}:`, reg.scope);
      });
    });
  } else {
    console.log('Service Worker: Not supported');
  }
  
  // Check manifest
  fetch('/manifest.json')
    .then(response => response.json())
    .then(manifest => {
      console.log('Manifest loaded:', manifest.name);
      console.log('Icons:', manifest.icons?.length || 0);
      console.log('Start URL:', manifest.start_url);
      console.log('Display:', manifest.display);
    })
    .catch(err => console.error('Manifest error:', err));
  
  // Check beforeinstallprompt support
  let promptSupported = false;
  window.addEventListener('beforeinstallprompt', () => {
    promptSupported = true;
    console.log('beforeinstallprompt: Supported & fired');
  });
  
  setTimeout(() => {
    if (!promptSupported) {
      console.log('beforeinstallprompt: Not supported or not fired');
      console.log('Browser:', navigator.userAgent);
    }
  }, 2000);
  
  // Check HTTPS
  console.log('HTTPS:', location.protocol === 'https:' || location.hostname === 'localhost');
  
  console.log('=== End PWA Check ===');
}

// Auto-run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkPWAReadiness);
} else {
  checkPWAReadiness();
}

// Make available globally for manual testing
window.checkPWAReadiness = checkPWAReadiness;
