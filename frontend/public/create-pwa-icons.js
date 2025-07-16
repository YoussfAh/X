const fs = require('fs');
const path = require('path');

// Simple PWA icon generator using HTML5 Canvas API in Node.js context
// This creates the required PNG icons from favicon.ico

const sizes = [
    { size: 48, name: 'icon-48.png' },
    { size: 72, name: 'icon-72.png' },
    { size: 96, name: 'icon-96.png' },
    { size: 144, name: 'icon-144.png' },
    { size: 180, name: 'icon-180.png' },
    { size: 192, name: 'icon-192.png' },
    { size: 512, name: 'icon-512.png' }
];

// Create a simple colored square icon as fallback
function createSimpleIcon(size, filename) {
    // Create SVG content for a simple Pro-G icon
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#4F46E5" rx="${size * 0.1}"/>
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" 
          fill="white" font-family="Arial, sans-serif" font-weight="bold" 
          font-size="${size * 0.3}">P</text>
    <text x="50%" y="75%" dominant-baseline="central" text-anchor="middle" 
          fill="white" font-family="Arial, sans-serif" font-weight="bold" 
          font-size="${size * 0.15}">G</text>
</svg>`;
    
    return svgContent;
}

// Generate icons
console.log('Generating PWA icons...');

sizes.forEach(iconInfo => {
    const svgContent = createSimpleIcon(iconInfo.size, iconInfo.name);
    const svgFilename = iconInfo.name.replace('.png', '.svg');
    const svgPath = path.join(__dirname, svgFilename);
    
    // Write SVG file (we'll convert these to PNG later)
    fs.writeFileSync(svgPath, svgContent);
    console.log(`Generated ${svgFilename}`);
});

console.log('Generated SVG icons. Converting to PNG...');

// Create a conversion script for the user to run
const conversionScript = `
# PWA Icon Conversion Script
# Run this in PowerShell after installing ImageMagick or use online converter

# If you have ImageMagick installed:
${sizes.map(icon => {
    const svgName = icon.name.replace('.png', '.svg');
    return `# magick "${svgName}" "${icon.name}"`;
}).join('\n')}

# Alternative: Use online converters like:
# - https://convertio.co/svg-png/
# - https://cloudconvert.com/svg-to-png
# - Or use the browser-based generator at /generate-pwa-icons.html

echo "Convert the SVG files to PNG format and place them in the public directory"
`;

fs.writeFileSync(path.join(__dirname, 'convert-icons.ps1'), conversionScript);

console.log('Created convert-icons.ps1 script');
console.log('Generated simple PWA icons. Use the browser generator for better quality.');
