// PWA Installation Diagnostic Script
// Run this in browser console: runPWADiagnostic()

console.log('� PWA Installation Diagnostic Tool loaded');
console.log('📋 Run: runPWADiagnostic() to start the diagnostic');

window.runPWADiagnostic = async () => {
  console.log('🔍 PWA Installation Diagnostic Starting...\n');
  
  console.log('='.repeat(50));
  console.log('PWA INSTALLATION DIAGNOSTIC');
  console.log('='.repeat(50));

  // 1. Basic Environment Check
  console.log('\n📋 1. ENVIRONMENT CHECK:');
  const env = {
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    userAgent: navigator.userAgent,
    serviceWorkerSupport: 'serviceWorker' in navigator,
    standalone: window.matchMedia('(display-mode: standalone)').matches,
    iosStandalone: window.navigator.standalone === true
  };
  
  console.table(env);

  // 2. Service Worker Check
  console.log('\n⚙️ 2. SERVICE WORKER CHECK:');
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        console.log('✅ Service Worker registered:', registration.scope);
        console.log('📄 Active SW:', registration.active?.scriptURL);
        console.log('🔄 Installing SW:', registration.installing?.scriptURL);
        console.log('⏳ Waiting SW:', registration.waiting?.scriptURL);
      } else {
        console.log('❌ No service worker registration found');
        console.log('💡 Attempting to register service worker...');
        
        try {
          const newReg = await navigator.serviceWorker.register('/service-worker.js');
          console.log('✅ Service worker registered successfully:', newReg.scope);
        } catch (regError) {
          console.error('❌ Service worker registration failed:', regError);
        }
      }
    } catch (error) {
      console.error('❌ Service worker check failed:', error);
    }
  } else {
    console.log('❌ Service Worker not supported');
  }

  // 3. Manifest Check
  console.log('\n📄 3. MANIFEST CHECK:');
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    console.log('✅ Manifest link found:', manifestLink.href);
    try {
      const response = await fetch(manifestLink.href);
      if (response.ok) {
        const manifest = await response.json();
        console.log('✅ Manifest loaded successfully');
        console.log('📝 Manifest content:', manifest);
        
        // Check required fields
        const required = ['name', 'start_url', 'display'];
        const missing = required.filter(field => !manifest[field]);
        if (missing.length === 0) {
          console.log('✅ All required manifest fields present');
        } else {
          console.log('❌ Missing required fields:', missing);
        }
        
        // Check icons
        if (manifest.icons && manifest.icons.length > 0) {
          console.log('✅ Icons found:', manifest.icons.length);
          manifest.icons.forEach((icon, i) => {
            console.log(`   Icon ${i + 1}: ${icon.src} (${icon.sizes})`);
          });
        } else {
          console.log('⚠️ No icons in manifest');
        }
      } else {
        console.log('❌ Manifest fetch failed:', response.status);
      }
    } catch (error) {
      console.error('❌ Manifest error:', error);
    }
  } else {
    console.log('❌ No manifest link found');
  }

  // 4. Installation Check
  console.log('\n📲 4. INSTALLATION STATUS:');
  if (env.standalone || env.iosStandalone) {
    console.log('✅ PWA is already installed');
  } else {
    console.log('❌ PWA not installed');
  }

  // 5. beforeinstallprompt Test
  console.log('\n💾 5. TESTING beforeinstallprompt EVENT:');
  const hasPromptEvent = await new Promise((resolve) => {
    let eventFired = false;
    let eventDetails = null;

    const handler = (e) => {
      // Only handle actual beforeinstallprompt events, not custom events
      if (e.type !== 'beforeinstallprompt' || e instanceof CustomEvent) {
        console.log('🔄 Ignoring custom event:', e.type);
        return;
      }
      
      eventFired = true;
      eventDetails = {
        eventType: e.type,
        platforms: e.platforms,
        hasPrompt: typeof e.prompt === 'function',
        hasUserChoice: !!e.userChoice
      };
      console.log('✅ Real beforeinstallprompt event fired!');
      console.log('📋 Event details:', eventDetails);
      
      // Only test the prompt if it exists, is a function, and this is a real browser event
      if (typeof e.prompt === 'function') {
        console.log('🧪 Testing prompt function...');
        try {
          const promptPromise = e.prompt();
          if (promptPromise && typeof promptPromise.then === 'function') {
            promptPromise.then(() => {
              console.log('✅ Prompt function works');
              return e.userChoice;
            }).then((choice) => {
              console.log('👤 User choice:', choice);
            }).catch((error) => {
              console.error('❌ Prompt error:', error);
            });
          } else {
            console.error('❌ prompt() did not return a promise');
          }
        } catch (error) {
          console.error('❌ Failed to call prompt function:', error);
        }
      } else {
        console.warn('⚠️ Event does not have a valid prompt function');
      }
      
      e.preventDefault();
    };

    window.addEventListener('beforeinstallprompt', handler);

    setTimeout(() => {
      window.removeEventListener('beforeinstallprompt', handler);
      
      if (eventFired) {
        console.log('✅ beforeinstallprompt event test completed');
      } else {
        console.log('❌ beforeinstallprompt event did NOT fire');
        console.log('💡 Possible reasons:');
        console.log('   - PWA is already installed');
        console.log('   - Browser doesn\'t support PWA installation');
        console.log('   - Service worker not properly registered');
        console.log('   - Manifest issues');
        console.log('   - HTTPS requirement not met');
        console.log('   - Browser has disabled the prompt');
      }
      
      resolve(eventFired);
    }, 3000);

    console.log('⏱️ Waiting 3 seconds for beforeinstallprompt event...');
  });

  // 6. Manual Installation Test
  console.log('\n🔧 6. MANUAL INSTALLATION TEST:');
  
  // Force clear dismissal
  sessionStorage.removeItem('pwa-install-dismissed');
  localStorage.removeItem('pwa-install-dismissed');
  console.log('✅ Cleared dismissal flags');
  
  // Test fake event
  const fakeEvent = {
    preventDefault: () => {},
    prompt: async () => {
      console.log('🎭 Fake prompt called');
      return Promise.resolve();
    },
    userChoice: Promise.resolve({ outcome: 'accepted' }),
    platforms: ['web']
  };
  
  window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), fakeEvent));
  console.log('✅ Dispatched fake beforeinstallprompt event');
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('DIAGNOSTIC SUMMARY');
  console.log('='.repeat(50));
  
  const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  const hasSW = 'serviceWorker' in navigator;
  const hasManifest = !!document.querySelector('link[rel="manifest"]');
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  
  console.log(`HTTPS/Localhost: ${isHTTPS ? '✅' : '❌'}`);
  console.log(`Service Worker: ${hasSW ? '✅' : '❌'}`);
  console.log(`Manifest: ${hasManifest ? '✅' : '❌'}`);
  console.log(`Already Installed: ${isInstalled ? '✅' : '❌'}`);
  console.log(`Install Event: ${hasPromptEvent ? '✅' : '❌'}`);
  
  const canInstall = isHTTPS && hasSW && hasManifest && !isInstalled;
  console.log(`\nCAN INSTALL PWA: ${canInstall ? '✅ YES' : '❌ NO'}`);
  
  if (!canInstall) {
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    if (!isHTTPS) console.log('   - Ensure site is served over HTTPS or localhost');
    if (!hasSW) console.log('   - Register a service worker');
    if (!hasManifest) console.log('   - Add a valid web app manifest');
    if (isInstalled) console.log('   - Uninstall the PWA first to test installation');
    if (!hasPromptEvent) console.log('   - Check browser support and PWA criteria');
  }
  
  console.log('\n🧪 MANUAL TEST COMMANDS:');
  console.log('   testManualInstallation() - Test manual installation');
  console.log('   location.reload() - Reload page');
  console.log('   runPWADiagnostic() - Run this diagnostic again');
  
  return hasPromptEvent;
};

// Manual Installation Test function
const testManualInstallation = () => {
  console.log('\n🔧 MANUAL INSTALLATION TEST:');
  
  // Force clear dismissal
  sessionStorage.removeItem('pwa-install-dismissed');
  localStorage.removeItem('pwa-install-dismissed');
  console.log('✅ Cleared dismissal flags');
  
  // Test fake event
  const fakeEvent = {
    preventDefault: () => {},
    prompt: async () => {
      console.log('🎭 Fake prompt called');
      return Promise.resolve();
    },
    userChoice: Promise.resolve({ outcome: 'accepted' }),
    platforms: ['web']
  };
  
  window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), fakeEvent));
  console.log('✅ Dispatched fake beforeinstallprompt event');
};

// Make test function available globally
window.testManualInstallation = testManualInstallation;

console.log('✅ PWA Diagnostic loaded. Use runPWADiagnostic() to start.');
