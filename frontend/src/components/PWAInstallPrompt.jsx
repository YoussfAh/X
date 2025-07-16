import React, { useState, useEffect } from 'react';
import { Button, Toast, ToastContainer } from 'react-bootstrap';
import { FaDownload, FaTimes, FaMobile } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import { useStaticAppSettings } from '../hooks/useStaticAppSettings';
import { getEffectiveIconUrl } from '../utils/iconUtils';
import { isMobileDevice, logDeviceInfo } from '../utils/deviceDetection';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  
  // Get app settings for dynamic content
  const { 
    siteName, 
    faviconImage, 
    faviconSvgCode,
    isLoading
  } = useStaticAppSettings();
  
  // Get effective icon URL (prioritizes SVG over image)
  const iconUrl = getEffectiveIconUrl(faviconImage, faviconSvgCode);

  // Check if app is already installed
  useEffect(() => {
    // Debug log device information
    if (process.env.NODE_ENV === 'development') {
      logDeviceInfo();
    }
    
    // Only show install prompt on home screen (not on login, register, etc.)
    const isOnHomeScreen = location.pathname === '/home' || location.pathname === '/';
    if (!isOnHomeScreen) {
      console.log('PWA: Not on home screen, install prompt disabled');
      setShowInstallPrompt(false);
      return;
    }
    
    // Check if user is on mobile device - only show install prompt on mobile
    const checkIsMobile = isMobileDevice();
    setIsMobile(checkIsMobile);
    
    // Don't show install prompt on desktop/PC
    if (!checkIsMobile) {
      console.log('PWA: Desktop device detected, install prompt disabled');
      return;
    }
    
    console.log('PWA: Mobile device detected and on home screen, install prompt enabled');
    
    // Check if running in standalone mode (installed PWA)
    const isStandalone = window.matchMedia(
      '(display-mode: standalone)'
    ).matches;
    const isIOSStandalone = window.navigator.standalone === true;

    if (isStandalone || isIOSStandalone) {
      setIsInstalled(true);
      return;
    }

    // Show install prompt after a delay if no beforeinstallprompt event
    const showPromptTimer = setTimeout(() => {
      if (!deferredPrompt && !sessionStorage.getItem('pwa-install-dismissed')) {
        console.log('PWA: No beforeinstallprompt event, showing manual prompt');
        setShowInstallPrompt(true);
      }
    }, 3000); // Show after 3 seconds

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('PWA: beforeinstallprompt event fired');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
      clearTimeout(showPromptTimer);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setShowToast(true);
      clearTimeout(showPromptTimer);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Handle window resize to re-check mobile status
    const handleResize = () => {
      const newIsMobile = isMobileDevice();
      setIsMobile(newIsMobile);
      
      // Hide prompt if switched to desktop
      if (!newIsMobile && showInstallPrompt) {
        setShowInstallPrompt(false);
        console.log('PWA: Switched to desktop, hiding install prompt');
      }
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(showPromptTimer);
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('resize', handleResize);
    };
  }, [deferredPrompt, showInstallPrompt, location.pathname]);

  // Handle install button click
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }

      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } else {
      // Fallback for browsers without beforeinstallprompt support
      console.log('PWA: Manual install instructions');
      
      // Check if it's iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isIOS) {
        alert('To install this app on iOS: Tap the Share button and then "Add to Home Screen"');
      } else {
        alert('To install this app: Look for the install option in your browser menu or address bar');
      }
      
      setShowInstallPrompt(false);
      sessionStorage.setItem('pwa-install-dismissed', 'true');
    }
  };

  // Handle dismiss
  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Remember dismissal for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Only show install prompt on home screen and if all conditions are met
  const isOnHomeScreen = location.pathname === '/home' || location.pathname === '/';
  
  // Don't show if already installed, dismissed this session, still loading settings, not on mobile, or not on home screen
  if (isInstalled || sessionStorage.getItem('pwa-install-dismissed') || isLoading || !isMobile || !isOnHomeScreen) {
    return null;
  }

  // Check if it's iOS (different install process)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <>
      {/* Install prompt for supported browsers */}
      {showInstallPrompt && !isIOS && (
        <div
          style={{
            position: 'fixed',
            bottom: '16px',
            left: '16px',
            right: '16px',
            backgroundColor: '#9966FF',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(153, 102, 255, 0.25)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '400px',
            margin: '0 auto',
          }}
        >
          {/* App Icon */}
          {iconUrl ? (
            <img 
              src={iconUrl} 
              alt={siteName}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                objectFit: 'contain',
                backgroundColor: 'rgba(255,255,255,0.1)',
                padding: '2px'
              }}
            />
          ) : (
            <FaMobile size={20} />
          )}
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontWeight: '600', 
              fontSize: '0.95rem',
              marginBottom: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              Install {siteName}
            </div>
            <div style={{ 
              fontSize: '0.8rem', 
              opacity: 0.9,
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              Get full app experience & offline access
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <Button
              size='sm'
              variant='light'
              onClick={handleInstallClick}
              style={{
                backgroundColor: 'white',
                color: '#9966FF',
                border: 'none',
                fontWeight: '600',
                fontSize: '0.8rem',
                padding: '4px 12px',
                borderRadius: '6px'
              }}
            >
              <FaDownload className='me-1' size={12} />
              Install
            </Button>
            <Button
              size='sm'
              variant='outline-light'
              onClick={handleDismiss}
              style={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                fontSize: '0.8rem',
                padding: '4px 8px',
                borderRadius: '6px'
              }}
            >
              <FaTimes size={12} />
            </Button>
          </div>
        </div>
      )}

      {/* iOS specific instructions */}
      {showInstallPrompt && isIOS && (
        <div
          style={{
            position: 'fixed',
            bottom: '16px',
            left: '16px',
            right: '16px',
            backgroundColor: '#9966FF',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(153, 102, 255, 0.25)',
            zIndex: 1050,
            maxWidth: '400px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            {/* App Icon */}
            {iconUrl ? (
              <img 
                src={iconUrl} 
                alt={siteName}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  objectFit: 'contain',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  padding: '2px',
                  flexShrink: 0
                }}
              />
            ) : (
              <div style={{ fontSize: '20px', flexShrink: 0 }}>📱</div>
            )}
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontWeight: '600', 
                marginBottom: '6px',
                fontSize: '0.95rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                Install {siteName}
              </div>
              <div style={{ 
                fontSize: '0.8rem', 
                lineHeight: 1.3,
                opacity: 0.95
              }}>
                Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>
              </div>
            </div>
            
            <Button
              size='sm'
              variant='outline-light'
              onClick={handleDismiss}
              style={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                fontSize: '0.8rem',
                padding: '4px 8px',
                borderRadius: '6px',
                flexShrink: 0
              }}
            >
              <FaTimes size={12} />
            </Button>
          </div>
        </div>
      )}

      {/* Success toast */}
      <ToastContainer position='top-end' className='p-3'>
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={4000}
          autohide
        >
          <Toast.Header>
            {iconUrl ? (
              <img 
                src={iconUrl} 
                alt={siteName}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  objectFit: 'contain',
                  marginRight: '8px'
                }}
              />
            ) : (
              <FaMobile className='me-2' />
            )}
            <strong className='me-auto'>{siteName} Installed!</strong>
          </Toast.Header>
          <Toast.Body>
            {siteName} is now installed on your device. You can access it from your
            home screen!
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default PWAInstallPrompt;
