// PWA Splash Screen Test
// Run this in browser console to test splash screen functionality

console.log('🧪 Testing PWA Splash Screen Implementation...');

// Test function to check if splash screen meta tags are being added
async function testSplashScreen() {
    try {
        // Fetch current settings
        const response = await fetch('/api/system/general');
        const settings = await response.json();
        
        console.log('📋 Current PWA Settings:', {
            pwaSplashScreenImage: settings.pwaSplashScreenImage || 'Not set',
            pwaShortName: settings.pwaShortName || 'Not set',
            pwaThemeColor: settings.pwaThemeColor || 'Not set'
        });
        
        // Check existing splash screen meta tags
        const existingSplashScreens = document.querySelectorAll('link[rel="apple-touch-startup-image"]');
        console.log('🔍 Found', existingSplashScreens.length, 'existing splash screen meta tags');
        
        // Check PWA capability meta tags
        const webAppCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
        const statusBarStyle = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
        
        console.log('📱 PWA Meta Tags:');
        console.log('   Web App Capable:', webAppCapable ? webAppCapable.content : '❌ Not found');
        console.log('   Status Bar Style:', statusBarStyle ? statusBarStyle.content : '❌ Not found');
        
        // Test with a sample image
        if (!settings.pwaSplashScreenImage) {
            console.log('⚠️ No splash screen image set. Testing with sample image...');
            
            // Use a placeholder image for testing
            const testSettings = {
                ...settings,
                pwaSplashScreenImage: 'https://via.placeholder.com/1125x2436/4F46E5/FFFFFF?text=Test+Splash'
            };
            
            // Import and test the splash screen function
            const { updatePWASplashScreen } = await import('./frontend/src/utils/pwaUtils.js');
            updatePWASplashScreen(testSettings);
            
            // Check if meta tags were added
            const newSplashScreens = document.querySelectorAll('link[rel="apple-touch-startup-image"]');
            console.log('✅ Added', newSplashScreens.length, 'splash screen meta tags');
            
            // List all splash screen sizes
            newSplashScreens.forEach((link, index) => {
                console.log(`   ${index + 1}. ${link.media || 'No media query'}`);
            });
        } else {
            console.log('✅ Splash screen image is set:', settings.pwaSplashScreenImage);
            console.log('💡 Splash screen should appear when PWA is launched on mobile devices');
        }
        
        // Check manifest
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
            console.log('📄 Manifest found:', manifestLink.href);
            try {
                const manifestResponse = await fetch(manifestLink.href);
                const manifest = await manifestResponse.json();
                console.log('🗂️ Manifest splash_screens:', manifest.splash_screens ? manifest.splash_screens.length + ' entries' : 'Not found');
            } catch (e) {
                console.log('❌ Could not fetch manifest:', e.message);
            }
        } else {
            console.log('❌ No manifest link found');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testSplashScreen();

console.log(`
📋 How to test PWA Splash Screen:

1. Set a splash screen image in Admin Panel → System Settings → PWA Settings
2. Install the PWA on your mobile device (Add to Home Screen)
3. Launch the PWA from your home screen
4. You should see the splash screen briefly before the app loads

💡 Note: Splash screens are most visible on iOS devices and some Android PWA implementations.
`);
