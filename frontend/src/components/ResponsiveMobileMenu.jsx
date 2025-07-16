import React, { useRef, useEffect } from 'react';
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
  FaUsers,
  FaChartLine,
  FaCog,
  FaSignOutAlt,
  FaTimes,
} from 'react-icons/fa';
import './ResponsiveMobileMenu.css';

const ResponsiveMobileMenu = ({ 
  isOpen, 
  onClose, 
  userInfo, 
  isDarkMode, 
  isVerySmallScreen,
  toggleTheme,
  logoutHandler 
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Prevent background scroll for mobile menu
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleLinkClick = () => {
    onClose();
  };

  if (!isOpen) {
    console.log('ResponsiveMobileMenu: isOpen is false, not rendering');
    return null;
  }

  console.log('ResponsiveMobileMenu: Rendering menu', { isOpen, isDarkMode, isVerySmallScreen });

  const mainNavItems = [
    {
      to: '/profile',
      icon: FaUserCircle,
      label: 'My Profile',
      color: '#4F46E5',
    },
    {
      to: '/workout-dashboard',
      icon: FaDumbbell,
      label: 'Workouts',
      color: '#059669',
    },
    {
      to: '/diet-dashboard',
      icon: FaUtensils,
      label: 'Nutrition',
      color: '#f59e0b',
    },
    {
      to: '/weight-tracker',
      icon: FaWeight,
      label: 'Weight',
      color: '#db2777',
    },
    {
      to: '/sleep-tracker',
      icon: FaMoon,
      label: 'Sleep',
      color: '#4F46E5',
    },
  ];

  const adminNavItems = [
    {
      to: '/admin/productlist',
      icon: FaBox,
      label: 'Products',
      color: '#6366f1',
    },
    {
      to: '/admin/userlist',
      icon: FaUsers,
      label: 'Users',
      color: '#0891b2',
    },
    {
      to: '/admin/workouts',
      icon: FaChartLine,
      label: 'Analytics',
      color: '#047857',
    },
    {
      to: '/admin/ai-analysis',
      icon: FaBrain,
      label: 'AI Analysis',
      color: '#8b5cf6',
    },
    {
      to: '/admin/system-settings',
      icon: FaCog,
      label: 'Settings',
      color: '#64748b',
    },
  ];

  return (
    <div 
      className={`responsive-mobile-menu ${isOpen ? 'show' : ''} ${isDarkMode ? 'dark' : 'light'}`}
      ref={menuRef}
    >
      {/* Header */}
      <div className="mobile-menu-header">
        <div className="user-info">
          <div className="user-avatar">
            <FaUserCircle size={20} />
          </div>
          <div className="user-details">
            <div className="greeting">Signed in as</div>
            <div className="user-email">{userInfo.email}</div>
          </div>
        </div>
        <button 
          className="close-button"
          onClick={onClose}
          aria-label="Close menu"
        >
          <FaTimes size={20} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="mobile-menu-content">
        {/* Main Navigation */}
        <div className="menu-section">
          <div className="menu-items">
            {mainNavItems.map((item) => (
              <Nav.Link
                key={item.to}
                as={Link}
                to={item.to}
                className="menu-item"
                onClick={handleLinkClick}
              >
                <div className="menu-item-icon" style={{ color: item.color }}>
                  <item.icon size={20} />
                </div>
                <span className="menu-item-label">{item.label}</span>
              </Nav.Link>
            ))}

            {/* AI Analysis if enabled */}
            {userInfo.featureFlags?.aiAnalysis && (
              <Nav.Link
                as={Link}
                to="/ai-analysis"
                className="menu-item"
                onClick={handleLinkClick}
              >
                <div className="menu-item-icon" style={{ color: '#8b5cf6' }}>
                  <FaBrain size={20} />
                </div>
                <span className="menu-item-label">AI Analysis</span>
              </Nav.Link>
            )}

            {/* Theme Toggle */}
            <button
              className="menu-item theme-toggle"
              onClick={toggleTheme}
            >
              <div className="menu-item-icon" style={{ color: isDarkMode ? '#fbbf24' : '#6366f1' }}>
                {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
              </div>
              <span className="menu-item-label">
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>
          </div>
        </div>

        {/* Admin Panel */}
        {userInfo.isAdmin && (
          <div className="menu-section admin-section">
            <div className="admin-header">
              <FaShieldAlt size={14} />
              <span>Admin Panel</span>
            </div>
            <div className="menu-items">
              {adminNavItems.map((item) => (
                <Nav.Link
                  key={item.to}
                  as={Link}
                  to={item.to}
                  className="menu-item admin-item"
                  onClick={handleLinkClick}
                >
                  <div className="menu-item-icon" style={{ color: item.color }}>
                    <item.icon size={20} />
                  </div>
                  <span className="menu-item-label">{item.label}</span>
                </Nav.Link>
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="menu-section logout-section">
          <button
            className="menu-item logout-item"
            onClick={() => {
              logoutHandler();
              handleLinkClick();
            }}
          >
            <div className="menu-item-icon logout-icon">
              <FaSignOutAlt size={20} />
            </div>
            <span className="menu-item-label">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveMobileMenu;
