import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import DataPrefetcher from './components/DataPrefetcher';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import GlobalPWAManager from './components/GlobalPWAManager';
import { TenantProvider } from './contexts/TenantContext';
import { logout } from './slices/authSlice';
import { useStaticAppSettings } from './hooks/useStaticAppSettings';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Header spacing fix - import last to override other styles
import './assets/styles/header-spacing-fix.css';

// Stagewise toolbar (AI helper) for development
import { StagewiseToolbar } from '@stagewise/toolbar-react';
import { ReactPlugin } from '@stagewise-plugins/react';

function StagewiseToolbarWrapper() {
  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <StagewiseToolbar
      config={{
        plugins: [ReactPlugin],
      }}
    />
  );
}

const AppContent = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);
  
  // Get app settings with instant static loading - no API calls!
  const { 
    siteName, 
    shouldShowContent,
    isDataReady 
  } = useStaticAppSettings();

  // Check if current route should have full width (no container constraints)
  const isFullWidthRoute = location.pathname === '/add-diet-entry';

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Theme detection
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          setIsDarkMode(
            document.documentElement.getAttribute('data-theme') === 'dark'
          );
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Set document title from settings with .env override
  useEffect(() => {
    document.title = 'App';
  }, []);

  useEffect(() => {
    const expirationTime = localStorage.getItem('expirationTime');
    if (expirationTime) {
      const currentTime = new Date().getTime();
      const expirationTimestamp = parseInt(expirationTime);

      // Only logout if expiration time is valid and actually expired
      if (!isNaN(expirationTimestamp) && currentTime > expirationTimestamp) {
        console.warn('Session expired, logging out user');
        dispatch(logout());
      }
    }
  }, [dispatch]);

  return (
    <>
      {/* Global PWA Manager - Updates PWA manifest and meta tags */}
      <GlobalPWAManager />
      
      {/* Stagewise AI toolbar for development */}
      <StagewiseToolbarWrapper />
      <DataPrefetcher />
      <ToastContainer
        position='bottom-right'
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme='colored'
        limit={3}
        className='toast-container'
        data-seamless='true'
      />
      <Header />
      <main
        style={{
          backgroundColor: isDarkMode ? 'transparent' : '#f8fafc',
          minHeight: '100vh',
          paddingTop: '70px', // Add padding for fixed header
          transition: 'background-color 0.3s ease, padding-top 0.3s ease',
        }}
      >
        {isFullWidthRoute ? (
          // Full width layout for specific routes like add-diet-entry
          <Outlet />
        ) : (
          // Container-constrained layout for other routes
          <div
            style={{
              width: '100%',
              maxWidth: '1200px',
              margin: '0 auto',
              padding: windowWidth <= 576 ? '0 0.25rem' : '0 0.5rem',
            }}
          >
            <Outlet />
          </div>
        )}
      </main>
      <Footer />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </>
  );
};

const App = () => {
  return (
    <TenantProvider>
      <AppContent />
    </TenantProvider>
  );
};

export default App;
