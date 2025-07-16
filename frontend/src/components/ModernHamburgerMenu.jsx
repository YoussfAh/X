import React from 'react';
import './ModernHamburgerMenu.css';

/**
 * Simple and natural hamburger menu button with no custom event handling
 */
const ModernHamburgerMenu = ({ 
  isOpen, 
  onClick, 
  isDarkMode = false,
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  // Simple click handler - no stopPropagation or preventDefault
  const handleClick = (e) => {
    console.log('🍔 Hamburger clicked - current state:', isOpen);
    if (onClick) onClick();
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'hamburger-small';
      case 'large': return 'hamburger-large';
      default: return 'hamburger-medium';
    }
  };

  return (
    <button 
      className={`modern-hamburger ${isOpen ? 'open' : ''} ${getSizeClass()} ${isDarkMode ? 'dark' : 'light'}`}
      onClick={handleClick}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
      type="button"
      data-testid="hamburger-button"
    >
      <div className="hamburger-container">
        <span className="hamburger-line line-top"></span>
        <span className="hamburger-line line-middle"></span>
        <span className="hamburger-line line-bottom"></span>
      </div>
    </button>
  );
};

export default ModernHamburgerMenu;
