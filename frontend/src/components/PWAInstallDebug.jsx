import React, { useState, useEffect } from 'react';

const PWAInstallDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const updateDebugInfo = async () => {
      const info = {
        // Basic PWA requirements
        isHTTPS: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
        hasServiceWorker: 'serviceWorker' in navigator,
        hasManifest: !!document.querySelector('link[rel="manifest"]'),
        
        // Installation status
        isStandalone: window.matchMedia('(display-mode: standalone)').matches,
        isIOSStandalone: window.navigator.standalone === true,
        
        // Browser info
        userAgent: navigator.userAgent,
        
        // Screen info
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        
        // Touch support
        touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        
        // Session storage
        installDismissed: !!sessionStorage.getItem('pwa-install-dismissed')
      };

      // Check manifest
      try {
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
          const response = await fetch(manifestLink.href);
          const manifest = await response.json();
          info.manifestValid = true;
          info.manifestData = manifest;
        }
      } catch (error) {
        info.manifestValid = false;
        info.manifestError = error.message;
      }

      setDebugInfo(info);
    };

    updateDebugInfo();
    
    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      setDebugInfo(prev => ({
        ...prev,
        beforeInstallPromptFired: true,
        promptEvent: !!e
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const clearDismissal = () => {
    sessionStorage.removeItem('pwa-install-dismissed');
    setDebugInfo(prev => ({ ...prev, installDismissed: false }));
    window.location.reload();
  };

  if (!showDebug) {
    return (
      <div
        onClick={() => setShowDebug(true)}
        style={{
          position: 'fixed',
          top: '50px',
          right: '10px',
          background: '#ff6b6b',
          color: 'white',
          padding: '8px',
          borderRadius: '50%',
          cursor: 'pointer',
          zIndex: 9999,
          fontSize: '12px',
          width: '30px',
          height: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        🐛
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '11px',
        fontFamily: 'monospace',
        maxWidth: '300px',
        maxHeight: '400px',
        overflow: 'auto',
        zIndex: 10000
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <strong>PWA Debug Info</strong>
        <button
          onClick={() => setShowDebug(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>
      
      <div style={{ lineHeight: '1.4' }}>
        <div><strong>Requirements:</strong></div>
        <div>HTTPS: {debugInfo.isHTTPS ? '✅' : '❌'}</div>
        <div>Service Worker: {debugInfo.hasServiceWorker ? '✅' : '❌'}</div>
        <div>Manifest: {debugInfo.hasManifest ? '✅' : '❌'}</div>
        <div>Manifest Valid: {debugInfo.manifestValid ? '✅' : '❌'}</div>
        
        <div style={{ marginTop: '10px' }}><strong>Installation:</strong></div>
        <div>Is Installed: {(debugInfo.isStandalone || debugInfo.isIOSStandalone) ? '✅' : '❌'}</div>
        <div>Standalone: {debugInfo.isStandalone ? '✅' : '❌'}</div>
        <div>iOS Standalone: {debugInfo.isIOSStandalone ? '✅' : '❌'}</div>
        <div>Dismissed: {debugInfo.installDismissed ? '✅' : '❌'}</div>
        <div>Prompt Event: {debugInfo.beforeInstallPromptFired ? '✅' : '❌'}</div>
        
        <div style={{ marginTop: '10px' }}><strong>Device:</strong></div>
        <div>Screen: {debugInfo.screenWidth}x{debugInfo.screenHeight}</div>
        <div>Touch: {debugInfo.touchSupport ? '✅' : '❌'}</div>
        <div>Mobile UA: {/iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone|IEMobile|Opera Mini/i.test(debugInfo.userAgent) ? '✅' : '❌'}</div>
        
        {debugInfo.manifestData && (
          <div style={{ marginTop: '10px' }}>
            <strong>Manifest:</strong>
            <div>Name: {debugInfo.manifestData.name}</div>
            <div>Icons: {debugInfo.manifestData.icons?.length || 0}</div>
            <div>Display: {debugInfo.manifestData.display}</div>
          </div>
        )}
        
        <div style={{ marginTop: '10px' }}>
          <button
            onClick={clearDismissal}
            style={{
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            Clear Dismissal & Reload
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallDebug;
