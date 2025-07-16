const fs = require('fs');
const path = require('path');

// Create simple PNG icons programmatically
// This generates minimal viable PNG icons for PWA

function createMinimalPNG(size) {
    // Create a minimal PNG header and data for a colored square
    // This is a very basic approach - for production, use proper image libraries
    
    // Simple colored square as base64 PNG data
    const canvas = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#4F46E5" rx="${Math.floor(size * 0.1)}"/>
        <circle cx="${size/2}" cy="${size/2}" r="${Math.floor(size * 0.3)}" fill="white" opacity="0.9"/>
        <text x="${size/2}" y="${size/2 + size * 0.05}" text-anchor="middle" fill="#4F46E5" 
              font-family="Arial" font-weight="bold" font-size="${Math.floor(size * 0.2)}">P</text>
    </svg>
    `;
    
    return canvas;
}

const sizes = [
    { size: 48, name: 'icon-48.png' },
    { size: 72, name: 'icon-72.png' },
    { size: 96, name: 'icon-96.png' },
    { size: 144, name: 'icon-144.png' },
    { size: 180, name: 'icon-180.png' },
    { size: 192, name: 'icon-192.png' },
    { size: 512, name: 'icon-512.png' }
];

// Create an HTML file that can generate the PNGs in the browser
const htmlGenerator = `<!DOCTYPE html>
<html>
<head>
    <title>PWA Icon Generator - Auto</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .status { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .btn { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>PWA Icon Auto-Generator</h1>
    <div id="status"></div>
    <button class="btn" onclick="generateAndDownload()">Generate & Download All Icons</button>
    
    <script>
        const sizes = ${JSON.stringify(sizes)};
        
        function addStatus(message, type = 'success') {
            const div = document.createElement('div');
            div.className = \`status \${type}\`;
            div.textContent = message;
            document.getElementById('status').appendChild(div);
        }
        
        function createIcon(size) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = size;
            canvas.height = size;
            
            // Background
            ctx.fillStyle = '#4F46E5';
            ctx.fillRect(0, 0, size, size);
            
            // Add border radius effect
            ctx.globalCompositeOperation = 'destination-in';
            ctx.beginPath();
            ctx.roundRect(0, 0, size, size, size * 0.1);
            ctx.fill();
            
            ctx.globalCompositeOperation = 'source-over';
            
            // White circle background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.arc(size/2, size/2, size * 0.3, 0, 2 * Math.PI);
            ctx.fill();
            
            // "P" text
            ctx.fillStyle = '#4F46E5';
            ctx.font = \`bold \${Math.floor(size * 0.25)}px Arial\`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('P', size/2, size/2);
            
            return canvas.toDataURL('image/png');
        }
        
        function downloadIcon(filename, dataUrl) {
            const link = document.createElement('a');
            link.download = filename;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        async function generateAndDownload() {
            document.getElementById('status').innerHTML = '';
            addStatus('Starting icon generation...');
            
            for (const iconInfo of sizes) {
                try {
                    const dataUrl = createIcon(iconInfo.size);
                    downloadIcon(iconInfo.name, dataUrl);
                    addStatus(\`✓ Generated \${iconInfo.name} (\${iconInfo.size}x\${iconInfo.size})\`);
                    
                    // Small delay between downloads
                    await new Promise(resolve => setTimeout(resolve, 300));
                } catch (error) {
                    addStatus(\`✗ Failed to generate \${iconInfo.name}: \${error.message}\`, 'error');
                }
            }
            
            addStatus('All icons generated! Check your Downloads folder.');
            addStatus('Copy the PNG files to your public directory.');
        }
        
        // Auto-start generation
        window.addEventListener('load', () => {
            setTimeout(generateAndDownload, 1000);
        });
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'auto-generate-icons.html'), htmlGenerator);
console.log('Created auto-generate-icons.html');
console.log('Open this file in browser to automatically generate and download PNG icons.');
