import { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useLogoutMutation } from '../slices/usersApiSlice';
import { logout } from '../slices/authSlice';
import {
  FaUser,
  FaMoon,
  FaSun,
  FaDumbbell,
  FaUserCircle,
  FaChartLine,
  FaSignOutAlt,
  FaBoxOpen,
  FaLayerGroup,
  FaUsers,
  FaKey,
  FaCog,
  FaShieldAlt,
  FaClock,
  FaBox,
  FaUtensils,
  FaWeight,
  FaBrain,
} from 'react-icons/fa';
import { ReactComponent as LogoSVG } from '../assets/logo.svg';
import { resetCart } from '../slices/cartSlice';
import { useStaticAppSettings } from '../hooks/useStaticAppSettings';
import { useTenant } from '../contexts/TenantContext';
import ModernHamburgerMenu from './ModernHamburgerMenu';
import ModernNavigationDropdown from './ModernNavigationDropdown';

const Header = () => {
  const { cartItems } = useSelector((state) => state.cart || { cartItems: [] });
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Get tenant branding
  const { branding: tenantBranding } = useTenant();

  // Scroll state for hide/show functionality
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollTimeoutRef = useRef(null);

  // Get app settings with instant static loading - no API calls!
  const { 
    siteName, 
    headerImage, 
    colorScheme: rawColorScheme, 
    shouldShowContent,
    isDataReady 
  } = useStaticAppSettings();

  // Safe colorScheme with defaults to prevent null reference errors
  const colorScheme = rawColorScheme || {
    primaryColor: tenantBranding?.colors?.primary || '#4F46E5',
    secondaryColor: tenantBranding?.colors?.secondary || '#7C3AED'
  };

  const [logoutApiCall] = useLogoutMutation();
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 768);
  const [expanded, setExpanded] = useState(false);

  // Optimized scroll handler with throttling
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    
    // Don't hide header if menu is open
    if (expanded) {
      return;
    }
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Immediate logic for showing/hiding header
    if (currentScrollY < 10) {
      // Always show header at top of page
      setIsHeaderVisible(true);
    } else if (currentScrollY < lastScrollY) {
      // Scrolling up - show header
      setIsHeaderVisible(true);
    } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
      // Scrolling down and past threshold - hide header (but not when menu is open)
      setIsHeaderVisible(false);
    }
    
    // Update last scroll position after a brief delay to prevent glitches
    scrollTimeoutRef.current = setTimeout(() => {
      setLastScrollY(currentScrollY);
    }, 50);
  }, [lastScrollY, expanded]);

  // Update theme state and detect screen size
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

    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 768);
    };

    // Add scroll listener with passive option for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [expanded, handleScroll]);

  const logoutHandler = async () => {
    try {
      await logoutApiCall().unwrap();
      dispatch(logout());
      dispatch(resetCart());
      navigate('/login');
      setExpanded(false);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    setIsDarkMode(!isDarkMode);
  };

  // Render the brand content using tenant branding
  const renderBrandContent = () => {
    const headerConfig = tenantBranding?.header || {};
    
    // PRIORITY 1: If showLogo is true and logoUrl is provided, show image
    if (headerConfig.showLogo && headerConfig.logoUrl) {
      return (
        <div
          style={{
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            overflow: 'hidden',
            borderRadius: '8px',
          }}
        >
          <img
            src={headerConfig.logoUrl}
            alt={tenantBranding?.name || 'App'}
            style={{
              height: '40px',
              maxWidth: '200px',
              objectFit: 'contain',
              filter: isDarkMode ? 'brightness(1.1)' : 'none',
            }}
            onError={(e) => {
              // If image fails to load, hide it and fallback to text
              e.target.style.display = 'none';
            }}
          />
        </div>
      );
    }

    // PRIORITY 2: Show app name from tenant branding
    const displayName = tenantBranding?.name || 'Grindx';
    
    return (
      <span
        style={{
          fontSize: isSmallScreen ? '1.4rem' : '1.6rem',
          fontWeight: '700',
          color: isDarkMode ? '#ffffff' : '#1e293b',
          textDecoration: 'none',
          letterSpacing: '-0.02em',
          transition: 'color 0.3s ease'
        }}
      >
        {displayName}
      </span>
    );
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: isHeaderVisible ? '0' : '-80px',
        left: '0',
        right: '0',
        height: '70px',
        backgroundColor: isDarkMode 
          ? 'rgba(0, 0, 0, 0.85)' // Dark AMOLED with transparency
          : 'rgba(255, 255, 255, 0.85)', // Light with transparency
        boxShadow: isDarkMode 
          ? '0 2px 20px rgba(0,0,0,0.4)' // More pronounced shadow for dark mode
          : '0 2px 20px rgba(0,0,0,0.1)', // Subtle shadow for light mode
        zIndex: 1000,
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(20px) saturate(180%)', // Enhanced blur effect
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }}
    >
      <Container
        fluid
        style={{
          height: '100%',
          padding: '0 1rem',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        <Navbar
          expand={false}
          className="h-100 p-0"
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Brand */}
          <Navbar.Brand
            as={Link}
            to="/home"
            className="d-flex align-items-center m-0"
            style={{
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            {renderBrandContent()}
          </Navbar.Brand>

          {/* User Actions */}
          <div className="d-flex align-items-center">
            {userInfo ? (
              <ModernHamburgerMenu
                isOpen={expanded}
                onClick={() => {
                  console.log('Hamburger clicked - current state:', expanded);
                  setExpanded(!expanded);
                }}
                isDarkMode={isDarkMode}
                size="medium"
              />
            ) : (
              <Button
                as={Link}
                to="/login"
                variant="outline-primary"
                size="sm"
                style={{
                  borderRadius: '8px',
                  fontWeight: '500',
                  padding: '0.5rem 1rem',
                  backgroundColor: tenantBranding?.colors?.primary || '#4F46E5',
                  borderColor: tenantBranding?.colors?.primary || '#4F46E5',
                  color: '#fff'
                }}
              >
                <FaUser className="me-2" />
                Sign In
              </Button>
            )}
          </div>
        </Navbar>
      </Container>

      {/* Navigation Dropdown */}
      {userInfo && (
        <ModernNavigationDropdown
          isOpen={expanded}
          onClose={() => setExpanded(false)}
          userInfo={userInfo}
          isDarkMode={isDarkMode}
          isSmallScreen={isSmallScreen}
          toggleTheme={toggleTheme}
          logoutHandler={logoutHandler}
        />
      )}
    </header>
  );
};

export default Header;
