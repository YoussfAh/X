// Quick PWA API Test
// Run this in browser console to test API endpoints

console.log("🧪 Testing PWA API Endpoints...");

// Test 1: Get current settings
fetch('/api/system-settings/general')
  .then(response => response.json())
  .then(data => {
    console.log("📋 Current PWA Settings:", data);
    
    // Check if all PWA fields exist
    const pwaFields = [
      'pwaIcon', 'pwaIconWithoutBackground', 
      'pwaShortName', 'pwaThemeColor', 'pwaBackgroundColor',
      'pwaSplashScreenImage', 'ogImage'
    ];
    
    const missingFields = pwaFields.filter(field => !(field in data));
    
    if (missingFields.length === 0) {
      console.log("✅ All PWA fields present in API");
    } else {
      console.log("❌ Missing PWA fields:", missingFields);
    }
  })
  .catch(error => {
    console.error("❌ Error fetching settings:", error);
  });

// Test 2: Check manifest endpoint
fetch('/api/system-settings/manifest.json')
  .then(response => response.json())
  .then(manifest => {
    console.log("📱 Dynamic Manifest:", manifest);
    
    // Check required manifest fields
    const requiredFields = ['name', 'short_name', 'theme_color', 'background_color', 'icons'];
    const missingManifestFields = requiredFields.filter(field => !(field in manifest));
    
    if (missingManifestFields.length === 0) {
      console.log("✅ All required manifest fields present");
    } else {
      console.log("❌ Missing manifest fields:", missingManifestFields);
    }
  })
  .catch(error => {
    console.error("❌ Error fetching manifest:", error);
  });

console.log("🎯 Copy and paste this script into browser console to test API endpoints");
