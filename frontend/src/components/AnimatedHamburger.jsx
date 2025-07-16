import React from 'react';
import './AnimatedHamburger.css';

const AnimatedHamburger = ({ isOpen, onClick }) => {
  // Prevent event bubbling to ensure proper click handling
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`hamburger-menu ${isOpen ? 'open' : ''}`}
      onClick={handleClick}
      style={{
        width: '28px',
        height: '28px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        transition: 'all 0.3s ease',
        border: 'none',
        outline: 'none',
        background: 'transparent',
        padding: '2px',
      }}
    >
      <span className="hamburger-line line1" />
      <span className="hamburger-line line2" />
      <span className="hamburger-line line3" />
    </div>
  );
};

export default AnimatedHamburger;
