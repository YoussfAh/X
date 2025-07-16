// Enhanced PWA Installation Script
// This script improves the PWA installation experience for Chrome and other browsers

(function() {
  'use strict';

  // Only run in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  // Enhanced PWA installation manager
  class PWAInstallManager {
    constructor() {
      this.deferredPrompt = null;
      this.isInstallable = false;
      this.isInstalled = false;
      this.init();
    }

    init() {
      // Listen for beforeinstallprompt event
      window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA: beforeinstallprompt event fired');
        
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        
        // Stash the event so it can be triggered later
        this.deferredPrompt = e;
        this.isInstallable = true;
        
        // Update UI to show install button
        this.updateInstallUI();
      });

      // Listen for appinstalled event
      window.addEventListener('appinstalled', (e) => {
        console.log('PWA: App was installed');
        this.isInstalled = true;
        this.deferredPrompt = null;
        this.isInstallable = false;
        
        // Hide install UI
        this.updateInstallUI();
        
        // Track installation
        this.trackInstallation();
      });

      // Check if already installed
      this.checkInstallStatus();
      
      // Add install methods to window for easy access
      window.PWAInstallManager = this;
    }

    checkInstallStatus() {
      // Check if running in standalone mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = window.navigator.standalone === true;
      
      if (isStandalone || isIOSStandalone) {
        this.isInstalled = true;
        console.log('PWA: App is running in standalone mode');
      }
    }

    updateInstallUI() {
      // Dispatch custom event for UI components to listen to
      const event = new CustomEvent('pwaInstallStatusChanged', {
        detail: {
          isInstallable: this.isInstallable,
          isInstalled: this.isInstalled
        }
      });
      window.dispatchEvent(event);
    }

    async promptInstall() {
      if (!this.deferredPrompt) {
        console.log('PWA: No deferred prompt available');
        return false;
      }

      try {
        // Show the install prompt
        this.deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await this.deferredPrompt.userChoice;
        
        console.log(`PWA: User choice: ${outcome}`);
        
        if (outcome === 'accepted') {
          this.isInstallable = false;
          this.trackInstallation();
        }
        
        // Clear the deferred prompt
        this.deferredPrompt = null;
        this.updateInstallUI();
        
        return outcome === 'accepted';
      } catch (error) {
        console.error('PWA: Error during installation prompt:', error);
        return false;
      }
    }

    trackInstallation() {
      // Track installation event
      if (typeof gtag !== 'undefined') {
        gtag('event', 'pwa_install', {
          event_category: 'PWA',
          event_label: 'User installed PWA'
        });
      }
      
      // You can add other analytics tracking here
      console.log('PWA: Installation tracked');
    }

    // Get installation instructions for different browsers
    getInstallInstructions() {
      const userAgent = navigator.userAgent.toLowerCase();
      
      if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
        return {
          browser: 'Chrome',
          instructions: 'Click the install button in the address bar or use the three-dot menu → "Install GRINDX"'
        };
      } else if (userAgent.includes('edg')) {
        return {
          browser: 'Edge',
          instructions: 'Click the install button in the address bar or use the three-dot menu → "Apps" → "Install GRINDX"'
        };
      } else if (userAgent.includes('firefox')) {
        return {
          browser: 'Firefox',
          instructions: 'Use the three-line menu → "Install" or look for the home screen option'
        };
      } else if (userAgent.includes('safari')) {
        return {
          browser: 'Safari',
          instructions: 'Tap the share button and select "Add to Home Screen"'
        };
      } else {
        return {
          browser: 'Unknown',
          instructions: 'Look for install or "Add to Home Screen" option in your browser menu'
        };
      }
    }
  }

  // Initialize PWA manager when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new PWAInstallManager();
    });
  } else {
    new PWAInstallManager();
  }

  // Add utility functions to window
  window.PWAUtils = {
    isInstallable: () => window.PWAInstallManager?.isInstallable || false,
    isInstalled: () => window.PWAInstallManager?.isInstalled || false,
    promptInstall: () => window.PWAInstallManager?.promptInstall() || Promise.resolve(false),
    getInstallInstructions: () => window.PWAInstallManager?.getInstallInstructions() || {}
  };

})();
