// PWA Complete Verification Script
// Run this in the browser console to verify PWA settings are applied correctly

console.log('🧪 PWA Complete Verification Test Starting...\n');

// Test 1: Check if manifest link exists and is dynamic
console.log('1️⃣ Testing Dynamic Manifest Link...');
const manifestLink = document.querySelector('link[rel="manifest"]');
if (manifestLink) {
    console.log('✅ Manifest link found:', manifestLink.href);
    
    // Check if it's the dynamic URL
    if (manifestLink.href.includes('/api/system-settings/manifest')) {
        console.log('✅ Using dynamic manifest URL');
    } else {
        console.log('❌ Not using dynamic manifest URL');
    }
} else {
    console.log('❌ Manifest link not found');
}

// Test 2: Fetch and verify manifest content
console.log('\n2️⃣ Testing Manifest Content...');
fetch('/api/system-settings/manifest')
    .then(response => response.json())
    .then(manifest => {
        console.log('✅ Manifest fetched successfully');
        console.log('📄 Manifest data:', manifest);
        
        // Check icon configuration
        if (manifest.icons && manifest.icons.length > 0) {
            console.log('✅ Icons found in manifest');
            manifest.icons.forEach((icon, index) => {
                console.log(`   Icon ${index + 1}:`, {
                    src: icon.src,
                    type: icon.type,
                    purpose: icon.purpose,
                    sizes: icon.sizes
                });
                
                // Verify icon display style logic
                if (icon.purpose === 'any') {
                    console.log('   📱 Transparent icon style (fills whole space)');
                } else if (icon.purpose === 'maskable') {
                    console.log('   📦 Normal icon style (with background container)');
                }
            });
        } else {
            console.log('❌ No icons found in manifest');
        }
        
        // Check splash screens
        if (manifest.splash_screens && manifest.splash_screens.length > 0) {
            console.log('✅ Splash screens found in manifest');
            console.log(`   ${manifest.splash_screens.length} splash screen sizes configured`);
            manifest.splash_screens.forEach((screen, index) => {
                console.log(`   Splash ${index + 1}: ${screen.sizes} - ${screen.src.substring(0, 50)}...`);
            });
        } else {
            console.log('⚠️ No splash screens found in manifest');
        }
    })
    .catch(error => {
        console.log('❌ Failed to fetch manifest:', error);
    });

// Test 3: Check PWA meta tags
console.log('\n3️⃣ Testing PWA Meta Tags...');
const metaTags = [
    { name: 'theme-color', desc: 'Theme Color' },
    { name: 'apple-mobile-web-app-capable', desc: 'Apple Web App Capable' },
    { name: 'apple-mobile-web-app-status-bar-style', desc: 'Apple Status Bar Style' },
    { name: 'apple-mobile-web-app-title', desc: 'Apple App Title' },
    { name: 'application-name', desc: 'Application Name' },
    { name: 'description', desc: 'Description' }
];

metaTags.forEach(tag => {
    const metaElement = document.querySelector(`meta[name="${tag.name}"]`);
    if (metaElement) {
        console.log(`✅ ${tag.desc}: "${metaElement.content}"`);
    } else {
        console.log(`❌ ${tag.desc}: Not found`);
    }
});

// Test 4: Check PWA icons
console.log('\n4️⃣ Testing PWA Icon Links...');
const iconTypes = [
    { selector: 'link[rel="icon"]', desc: 'Favicon' },
    { selector: 'link[rel="apple-touch-icon"]', desc: 'Apple Touch Icon' }
];

iconTypes.forEach(iconType => {
    const iconElements = document.querySelectorAll(iconType.selector);
    if (iconElements.length > 0) {
        console.log(`✅ ${iconType.desc} found (${iconElements.length} elements)`);
        iconElements.forEach((icon, index) => {
            console.log(`   ${iconType.desc} ${index + 1}: ${icon.href}`);
        });
    } else {
        console.log(`❌ ${iconType.desc}: Not found`);
    }
});

// Test 5: Check splash screen meta tags (iOS)
console.log('\n5️⃣ Testing iOS Splash Screen Meta Tags...');
const splashScreens = document.querySelectorAll('link[rel="apple-touch-startup-image"]');
if (splashScreens.length > 0) {
    console.log(`✅ Apple splash screens found (${splashScreens.length} elements)`);
    splashScreens.forEach((splash, index) => {
        console.log(`   Splash ${index + 1}: ${splash.media}`);
    });
} else {
    console.log('⚠️ No Apple splash screens found');
}

// Test 6: PWA Installability
console.log('\n6️⃣ Testing PWA Installability...');
if ('serviceWorker' in navigator) {
    console.log('✅ Service Worker supported');
} else {
    console.log('❌ Service Worker not supported');
}

// Check if PWA install prompt is available
let installPrompt = null;
window.addEventListener('beforeinstallprompt', (event) => {
    console.log('✅ PWA install prompt available');
    installPrompt = event;
});

// Test 7: Current Settings Summary
console.log('\n7️⃣ Getting Current PWA Settings...');
fetch('/api/system-settings/general')
    .then(response => response.json())
    .then(settings => {
        console.log('✅ Current PWA settings:');
        console.log('   App Name:', settings.siteName || 'Not set');
        console.log('   PWA Short Name:', settings.pwaShortName || 'Not set');
        console.log('   Description:', settings.siteDescription || 'Not set');
        console.log('   Theme Color:', settings.pwaThemeColor || 'Not set');
        console.log('   Background Color:', settings.pwaBackgroundColor || 'Not set');
        console.log('   PWA Icon:', settings.pwaIcon ? '✅ Set' : '❌ Not set');
        console.log('   Icon Without Background:', settings.pwaIconWithoutBackground ? '✅ Transparent style' : '📦 Normal style');
        console.log('   Splash Screen:', settings.pwaSplashScreenImage ? '✅ Set' : '❌ Not set');
    })
    .catch(error => {
        console.log('❌ Failed to fetch settings:', error);
    });

// Test 8: Installation Test Function
console.log('\n8️⃣ PWA Installation Test Function Available');
window.testPWAInstall = function() {
    console.log('🚀 Testing PWA Installation...');
    
    if (installPrompt) {
        installPrompt.prompt();
        installPrompt.userChoice.then((result) => {
            if (result.outcome === 'accepted') {
                console.log('✅ User accepted PWA installation');
            } else {
                console.log('❌ User dismissed PWA installation');
            }
            installPrompt = null;
        });
    } else {
        console.log('⚠️ PWA install prompt not available. Try:');
        console.log('   1. Chrome: Click install icon in address bar');
        console.log('   2. Safari iOS: Share → Add to Home Screen');
        console.log('   3. Chrome Android: Menu → Install App');
    }
};

console.log('\n🎯 Test Summary Complete!');
console.log('📋 To test PWA installation, run: testPWAInstall()');
console.log('🔄 To rerun this test, refresh and paste this script again');
console.log('📱 For mobile testing, open browser dev tools on device');

setTimeout(() => {
    console.log('\n✨ PWA Verification Test Completed! Check results above.');
}, 2000);
