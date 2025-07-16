import React, { useRef, useEffect, useState } from 'react';
import { Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaUserCircle,
  FaDumbbell,
  FaUtensils,
  FaMoon,
  FaWeight,
  FaBrain,
  FaSun,
  FaShieldAlt,
  FaBox,
  FaLayerGroup,
  FaUsers,
  FaKey,
  FaChartLine,
  FaClock,
  FaCog,
  FaSignOutAlt,
  FaRulerCombined,
  FaDatabase,
  FaDumbbell as FaExercise,
  FaUserTie,
} from 'react-icons/fa';
import './ModernNavigationDropdown.css';

const ModernNavigationDropdown = ({ 
  isOpen, 
  onClose, 
  userInfo, 
  isDarkMode, 
  isSmallScreen,
  toggleTheme,
  logoutHandler 
}) => {
  const dropdownRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [actualViewportHeight, setActualViewportHeight] = useState(window.innerHeight);
  const isMobileScreen = windowWidth <= 768; // Updated breakpoint

  // Dynamic viewport height calculation for mobile browsers
  useEffect(() => {
    const updateViewportHeight = () => {
      // Use visualViewport API if available (modern browsers)
      if (window.visualViewport) {
        setActualViewportHeight(window.visualViewport.height);
      } else {
        // Fallback to window.innerHeight
        setActualViewportHeight(window.innerHeight);
      }
    };

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      updateViewportHeight();
    };

    // Initial calculation
    updateViewportHeight();

    // Listen for viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
    }
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Dynamic styles for mobile menu height
  useEffect(() => {
    if (isMobileScreen && isOpen && dropdownRef.current) {
      const headerHeight = 70; // Header height
      const padding = 20; // Extra padding for safety
      const maxHeight = actualViewportHeight - headerHeight - padding;
      
      dropdownRef.current.style.setProperty('--dynamic-max-height', `${maxHeight}px`);
    }
  }, [isMobileScreen, isOpen, actualViewportHeight]);

  // Always call useEffect before any conditional returns
  useEffect(() => {
    // Only add handlers when the menu is open
    if (!isOpen) return;

    // Enhanced click-away handler for all screen sizes
    const handleClickAway = (event) => {
      // Check if click is outside the dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Also check if click is not on the hamburger button itself
        const hamburgerButton = document.querySelector('[data-testid="hamburger-button"]');
        if (hamburgerButton && !hamburgerButton.contains(event.target)) {
          console.log('📋 Click outside menu detected, closing menu');
          onClose();
        }
      }
    };

    // ESC key handler for accessibility
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        console.log('📋 ESC key pressed, closing menu');
        onClose();
      }
    };

    // Add click-away handler with slight delay to prevent immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickAway, true);
      document.addEventListener('touchstart', handleClickAway, true);
    }, 100);

    // Add keyboard accessibility handler
    document.addEventListener('keydown', handleEscapeKey, false);

    // Prevent body scroll on mobile when menu is open
    if (isMobileScreen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      // Clean up
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickAway, true);
      document.removeEventListener('touchstart', handleClickAway, true);
      document.removeEventListener('keydown', handleEscapeKey, false);
      
      // Restore body scroll
      if (isMobileScreen) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, onClose, isMobileScreen]);

  // Always use the same dropdown component for all screen sizes
  console.log('ModernNavigationDropdown: Using unified dropdown', { windowWidth, isMobileScreen, isOpen });

  const handleLinkClick = (e) => {
    // Allow navigation to work normally, but prevent menu-closing events from triggering
    console.log('Link clicked, closing menu');
    onClose();
  };

  if (!isOpen) return null;

  const userNavItems = [
    {
      to: '/profile',
      icon: FaUserCircle,
      label: 'My Profile',
      color: '#4F46E5',
    },
    {
      to: '/workout-dashboard',
      icon: FaDumbbell,
      label: 'Workout Dashboard',
      color: '#059669',
    },
    {
      to: '/diet-dashboard',
      icon: FaUtensils,
      label: 'Diet Dashboard',
      color: '#f59e0b',
    },
    {
      to: '/sleep-tracker',
      icon: FaMoon,
      label: 'Sleep Tracker',
      color: '#4F46E5',
    },
    {
      to: '/weight-tracker',
      icon: FaWeight,
      label: 'Weight Tracker',
      color: '#db2777',
    },
  ];

  const adminNavItems = [
    {
      to: '/admin/userlist',
      icon: FaUsers,
      label: 'Users',
      color: '#0891b2',
    },
    {
      to: '/admin/productlist',
      icon: FaBox,
      label: 'Units',
      color: '#6366f1',
    },
    {
      to: '/admin/collectionlist',
      icon: FaLayerGroup,
      label: 'Collections',
      color: '#7c3aed',
    },
   
    {
      to: '/admin/access-codes',
      icon: FaKey,
      label: 'Access Codes',
      color: '#ea580c',
    },
    {
      to: '/admin/workouts',
      icon: FaExercise,
      label: 'Exercise Tracking',
      color: '#059669',
    },
    {
      to: '/admin/ai-analysis',
      icon: FaBrain,
      label: 'AI Analysis',
      color: '#8b5cf6',
    },
    {
      to: '/admin/timeframe-management',
      icon: FaClock,
      label: 'CRM',
      color: '#dc2626',
    },
    {
      to: '/admin/system-settings',
      icon: FaCog,
      label: 'System Settings',
      color: '#64748b',
    },
  ];

  // Add tenant management items
  const tenantNavItems = [
    {
      to: '/super-admin',
      icon: FaChartLine,
      label: 'Super Admin Dashboard',
      color: '#FFD700',
    },
    {
      to: '/super-admin/tenants',
      icon: FaDatabase,
      label: 'Manage Tenants',
      color: '#10B981',
    },
    {
      to: '/super-admin/tenants/create',
      icon: FaUserTie,
      label: 'Create Tenant',
      color: '#3B82F6',
    },
  ];

  return (
    <>
      {/* Backdrop for all screens to handle outside clicks */}
      {isOpen && (
        <div 
          className={`menu-backdrop ${isMobileScreen ? 'mobile-menu-backdrop' : 'desktop-menu-backdrop'}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📱 Backdrop clicked - closing menu');
            onClose();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📱 Backdrop touched - closing menu');
            onClose();
          }}
        />
      )}
      
      {/* Dropdown Menu */}
      <div 
        ref={dropdownRef}
        className={`modern-navigation-dropdown ${isOpen ? 'show' : ''} ${isDarkMode ? 'dark' : 'light'} ${isMobileScreen ? 'mobile' : 'desktop'}`}
        onClick={(e) => {
          // Prevent clicks inside the dropdown from closing it
          e.stopPropagation();
        }}
      >
        {/* User Info Header */}
        <div className="dropdown-header">
          <div className="user-info">
            <div className="avatar">
              <FaUserCircle size={24} />
            </div>
            <div className="user-details">
              <div className="greeting">Signed in as</div>
              <div className="email">{userInfo.email}</div>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
            <div className="dropdown-section">
              <div className="nav-items">
                {userNavItems.map((item) => (
                  <Nav.Link
                key={item.to}
                as={Link}
                to={item.to}
                className="nav-item"
                onClick={handleLinkClick}
                  >
                <div className="nav-item-content">
                  <div className="nav-icon" style={{ color: item.color }}>
                    <item.icon size={18} />
                  </div>
                  <span className="nav-label">{item.label}</span>
                </div>
                  </Nav.Link>
                ))}

                {/* AI Analysis if enabled */}
                {userInfo.featureFlags?.aiAnalysis && (
                  <Nav.Link
                as={Link}
                to="/ai-analysis"
                className="nav-item"
                onClick={handleLinkClick}
                  >
                <div className="nav-item-content">
                  <div className="nav-icon" style={{ color: '#8b5cf6' }}>
                    <FaBrain size={18} />
                  </div>
                  <span className="nav-label">AI Analysis</span>
                </div>
                  </Nav.Link>
                )}

                {/* Theme Toggle */}
                <Nav.Link
                  as="button"
                  className="nav-item"
                  onClick={toggleTheme}
                >
                  <div className="nav-item-content">
                <div className="nav-icon" style={{ color: isDarkMode ? '#fbbf24' : '#6366f1' }}>
                  {isDarkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
                </div>
                <span className="nav-label">
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </span>
                  </div>
                </Nav.Link>
              </div>
            </div>

            {/* Super Admin section - show only for super admins */}
            {userInfo?.isSuperAdmin && (
              <div className="dropdown-section">
                <div className="nav-section-title"> </div>
                <div className="nav-items">
                  {tenantNavItems.map((item) => (
                    <Nav.Link
                      key={item.to}
                      as={Link}
                      to={item.to}
                      className="nav-item"
                      onClick={handleLinkClick}
                    >
                      <div className="nav-item-content">
                        <div className="nav-icon" style={{ color: item.color }}>
                          <item.icon size={18} />
                        </div>
                        <span className="nav-label">{item.label}</span>
                      </div>
                    </Nav.Link>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Panel */}
        {userInfo.isAdmin && (
          <div className="dropdown-section admin-section">
            <div className="admin-title">
              <FaShieldAlt size={12} />
              <span>Admin Panel</span>
            </div>
            <div className="nav-items">
              {adminNavItems.map((item) => (
                <Nav.Link
                  key={item.to}
                  as={Link}
                  to={item.to}
                  className="nav-item admin-item"
                  onClick={handleLinkClick}
                >
                  <div className="nav-item-content">
                    <div className="nav-icon" style={{ color: item.color }}>
                      <item.icon size={18} />
                    </div>
                    <span className="nav-label">{item.label}</span>
                  </div>
                </Nav.Link>
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="dropdown-section logout-section">
          <button
            className="nav-item logout-item"
            onClick={() => {
              logoutHandler();
              handleLinkClick();
            }}
          >
            <div className="nav-item-content">
              <div className="nav-icon logout-icon">
                <FaSignOutAlt size={18} />
              </div>
              <span className="nav-label">Sign Out</span>
            </div>
          </button>
        </div>
      </div>
    </>
  );
};

export default ModernNavigationDropdown;
