/**
 * Icon Utilities for PWA and Favicon Management
 * Handles proper icon centering, aspect ratio preservation, and PWA integration
 */

/**
 * Update favicon dynamically with proper centering and aspect ratio
 * @param {string} iconUrl - URL of the icon image (can be a blob URL from SVG)
 * @param {boolean} preserveRatio - Whether to preserve aspect ratio
 */
export const updateFavicon = (iconUrl, preserveRatio = true) => {
  if (!iconUrl) return;

  // If it's an SVG blob URL, we can use it directly for modern browsers
  if (iconUrl.startsWith('blob:') || iconUrl.includes('.svg')) {
    updateFaviconDirectly(iconUrl);
    return;
  }

  // For other image types, create a canvas for proper processing
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    // Set canvas size for favicon (32x32 is standard)
    canvas.width = 32;
    canvas.height = 32;
    
    // Clear canvas with transparent background
    ctx.clearRect(0, 0, 32, 32);
    
    if (preserveRatio) {
      // Calculate dimensions to maintain aspect ratio while fitting in container
      const scale = Math.min(32 / img.width, 32 / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      // Center the image
      const x = (32 - scaledWidth) / 2;
      const y = (32 - scaledHeight) / 2;
      
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    } else {
      // Fill the entire canvas
      ctx.drawImage(img, 0, 0, 32, 32);
    }
    
    // Convert canvas to data URL
    const faviconUrl = canvas.toDataURL('image/png');
    
    // Update all favicon links
    updateFaviconLinks(faviconUrl);
  };
  
  img.onerror = () => {
    console.warn('Failed to load icon for favicon:', iconUrl);
    // Fallback to original URL
    updateFaviconDirectly(iconUrl);
  };
  
  img.src = iconUrl;
};

/**
 * Update favicon directly without canvas processing (for SVG)
 * @param {string} iconUrl - Direct icon URL or blob URL
 */
const updateFaviconDirectly = (iconUrl) => {
  updateFaviconLinks(iconUrl);
};

/**
 * Update all favicon link elements in the document head
 * @param {string} faviconUrl - The favicon URL or data URL
 */
const updateFaviconLinks = (faviconUrl) => {
  // First, remove all existing favicon links to ensure a clean slate
  document.querySelectorAll('link[rel*="icon"]').forEach(link => link.remove());

  // Update or create favicon links
  const faviconTypes = [
    { rel: 'icon', type: 'image/png' }, // Preferred format for general favicons
    { rel: 'shortcut icon', type: 'image/x-icon' }, // Legacy support
    { rel: 'apple-touch-icon' },
    { rel: 'apple-touch-icon', sizes: '152x152' },
    { rel: 'apple-touch-icon', sizes: '180x180' },
    { rel: 'apple-touch-icon', sizes: '167x167' },
    { rel: 'mask-icon' } // Safari Pinned Tabs (can be SVG)
  ];
  
  faviconTypes.forEach(({ rel, type, sizes }) => {
    // For 'icon' and 'shortcut icon', only use if faviconUrl is NOT an SVG
    if ((rel === 'icon' || rel === 'shortcut icon') && faviconUrl.endsWith('.svg')) {
      console.log(`Skipping SVG for ${rel} link to prevent it from being a general favicon.`);
      return; // Skip this type if it's an SVG and not a mask-icon
    }

    // For 'mask-icon', it's explicitly designed for SVGs, so allow it.
    if (rel === 'mask-icon' && !faviconUrl.endsWith('.svg')) {
        console.warn(`Mask icon should ideally be an SVG. Provided URL is not SVG: ${faviconUrl}`);
        return; // Mask icon should be SVG. If not, skip.
    }

    let link = document.createElement('link');
    link.rel = rel;
    if (type) link.type = type;
    if (sizes) link.sizes = sizes;
    link.href = faviconUrl;
    document.head.appendChild(link);
  });
};

/**
 * Generate PWA icons at different sizes with proper centering
 * @param {string} iconUrl - Source icon URL
 * @param {boolean} preserveRatio - Whether to preserve aspect ratio
 * @returns {Promise<Object>} Object containing icon data URLs for different sizes
 */
export const generatePWAIcons = (iconUrl, preserveRatio = true) => {
  return new Promise((resolve, reject) => {
    if (!iconUrl) {
      reject(new Error('No icon URL provided'));
      return;
    }

    const img = new Image();
    const sizes = [16, 32, 48, 72, 96, 128, 144, 152, 192, 384, 512];
    const icons = {};
    
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      sizes.forEach(size => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = size;
        canvas.height = size;
        
        // Clear with transparent background
        ctx.clearRect(0, 0, size, size);
        
        if (preserveRatio) {
          // Calculate dimensions to maintain aspect ratio
          const scale = Math.min(size / img.width, size / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          
          // Center the image
          const x = (size - scaledWidth) / 2;
          const y = (size - scaledHeight) / 2;
          
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        } else {
          // Fill the entire canvas
          ctx.drawImage(img, 0, 0, size, size);
        }
        
        icons[`${size}x${size}`] = canvas.toDataURL('image/png');
      });
      
      resolve(icons);
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load icon: ${iconUrl}`));
    };
    
    img.src = iconUrl;
  });
};

/**
 * Determine the MIME type of an image from its URL
 * @param {string} url - Image URL
 * @returns {string} MIME type
 */
export const getImageMimeType = (url) => {
  if (!url) return 'image/x-icon';
  
  const extension = url.split('.').pop().toLowerCase();
  
  switch (extension) {
    case 'svg':
      return 'image/svg+xml';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'bmp':
      return 'image/bmp';
    default:
      return 'image/x-icon';
  }
};

/**
 * Check if an image URL is accessible
 * @param {string} url - Image URL to check
 * @returns {Promise<boolean>} True if accessible, false otherwise
 */
export const isImageAccessible = (url) => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }
    
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

/**
 * Create a canvas-based icon with background and proper centering
 * @param {string} iconUrl - Source icon URL
 * @param {number} size - Canvas size
 * @param {string} backgroundColor - Background color
 * @param {boolean} preserveRatio - Whether to preserve aspect ratio
 * @returns {Promise<string>} Data URL of the generated icon
 */
export const createIconWithBackground = (iconUrl, size = 512, backgroundColor = 'transparent', preserveRatio = true) => {
  return new Promise((resolve, reject) => {
    if (!iconUrl) {
      reject(new Error('No icon URL provided'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    canvas.width = size;
    canvas.height = size;
    
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Fill background if not transparent
      if (backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, size, size);
      }
      
      if (preserveRatio) {
        // Calculate dimensions to maintain aspect ratio with some padding
        const padding = size * 0.1; // 10% padding
        const maxSize = size - (padding * 2);
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        // Center the image
        const x = (size - scaledWidth) / 2;
        const y = (size - scaledHeight) / 2;
        
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      } else {
        // Fill the entire canvas
        ctx.drawImage(img, 0, 0, size, size);
      }
      
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load icon: ${iconUrl}`));
    };
    
    img.src = iconUrl;
  });
};

/**
 * Create a blob URL from SVG code
 * @param {string} svgCode - SVG code as string
 * @returns {string} Blob URL for the SVG
 */
export const createSvgBlobUrl = (svgCode) => {
  if (!svgCode) return null;
  
  try {
    const svgBlob = new Blob([svgCode], { type: 'image/svg+xml' });
    return URL.createObjectURL(svgBlob);
  } catch (error) {
    console.error('Error creating SVG blob URL:', error);
    return null;
  }
};

/**
 * Get the effective icon URL (prioritizes SVG code over image URL)
 * @param {string} imageUrl - Image URL
 * @param {string} svgCode - SVG code
 * @returns {string|null} Effective icon URL
 */
export const getEffectiveIconUrl = (imageUrl, svgCode) => {
  // Only use custom SVG code if explicitly set in admin
  if (svgCode && svgCode.trim()) {
    return createSvgBlobUrl(svgCode);
  }
  // Only use custom image URL if explicitly set in admin
  if (imageUrl && imageUrl.trim()) {
    return imageUrl;
  }
  // Default to favicon.ico for PWA
  return '/favicon.ico';
};
