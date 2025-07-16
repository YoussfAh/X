/**
 * Dynamic PWA Manifest Generator
 * 
 * This script generates the PWA manifest dynamically based on the app branding configuration.
 * It replaces the static manifest.json file to ensure all PWA settings come from variables.
 */

// Import the app branding configuration
import { APP_BRANDING } from '../src/config/appBranding.js';

/**
 * Generate dynamic PWA manifest
 * @returns {Object} Complete PWA manifest object
 */
export function generateManifest() {
  const { pwa, icons } = APP_BRANDING;
  
  return {
    short_name: pwa.shortName,
    name: pwa.name,
    description: pwa.description,
    icons: [
      {
        src: "favicon.ico",
        sizes: "16x16 24x24 32x32 48x48 64x64",
        type: "image/x-icon",
        purpose: "any"
      },
      {
        src: "icon-48.png",
        sizes: "48x48",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "icon-72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "icon-96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "icon-144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "icon-180.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any"
      },
      {
        src: icons.icon192.replace('/', ''),
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: icons.icon192.replace('/', ''),
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: icons.icon512.replace('/', ''),
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: icons.icon512.replace('/', ''),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    start_url: pwa.startUrl + "?utm_source=pwa&utm_medium=homescreen",
    display: pwa.display,
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    orientation: pwa.orientation,
    theme_color: pwa.themeColor,
    background_color: pwa.backgroundColor,
    scope: pwa.scope,
    categories: pwa.categories,
    lang: pwa.lang,
    dir: "ltr",
    prefer_related_applications: false,
    shortcuts: [
      {
        name: "Home Dashboard",
        short_name: "Dashboard",
        description: "Open main dashboard",
        url: "/home?utm_source=pwa_shortcut",
        icons: [
          {
            src: icons.icon192.replace('/', ''),
            sizes: "192x192",
            type: "image/png"
          }
        ]
      },
      {
        name: "Workout Tracker",
        short_name: "Workout",
        description: "Track your workouts",
        url: "/workout-dashboard?utm_source=pwa_shortcut",
        icons: [
          {
            src: icons.icon192.replace('/', ''),
            sizes: "192x192",
            type: "image/png"
          }
        ]
      },
      {
        name: "Diet Tracker",
        short_name: "Diet",
        description: "Log your meals",
        url: "/diet-dashboard?utm_source=pwa_shortcut",
        icons: [
          {
            src: icons.icon192.replace('/', ''),
            sizes: "192x192",
            type: "image/png"
          }
        ]
      }
    ],
    screenshots: [
      {
        src: icons.icon512.replace('/', ''),
        sizes: "512x512",
        type: "image/png",
        form_factor: "narrow"
      },
      {
        src: icons.icon512.replace('/', ''),
        sizes: "512x512",
        type: "image/png",
        form_factor: "wide"
      }
    ],
    edge_side_panel: {
      preferred_width: 400
    },
    launch_handler: {
      client_mode: "focus-existing"
    },
    protocol_handlers: [
      {
        protocol: `web+${pwa.shortName.toLowerCase()}`,
        url: "/?handler=%s"
      }
    ]
  };
}

// For Node.js environments or build scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateManifest };
}

export default generateManifest; 