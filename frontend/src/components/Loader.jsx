import React from 'react';
import { Spinner } from 'react-bootstrap';

const Loader = ({
  size = 'medium', // small, medium, large
  text = 'Loading...',
  overlay = false,
  variant = 'primary', // primary, light, dark, accent
  fullPage = false
}) => {
  const getSize = () => {
    switch(size) {
      case 'small': return { width: '30px', height: '30px' };
      case 'large': return { width: '120px', height: '120px' };
      case 'medium':
      default: return { width: '60px', height: '60px' };
    }
  };

  const getColorClass = () => {
    switch(variant) {
      case 'light': return 'text-light';
      case 'dark': return 'text-dark';
      case 'accent': return 'text-accent';
      case 'primary':
      default: return '';
    }
  };

  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  
  const dimensions = getSize();
  const colorClass = getColorClass();

  const pulseAnimation = {
    animation: 'pulse 1.5s infinite ease-in-out',
  };

  const spinnerContainerStyle = {
    textAlign: 'center',
    padding: fullPage ? '0' : '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...(fullPage ? {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
      zIndex: 9999,
    } : {}),
    ...(overlay ? {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
      borderRadius: '12px',
      zIndex: 999,
    } : {})
  };

  return (
    <div style={spinnerContainerStyle} className="animated-loader">
      <div style={{ position: 'relative' }}>
        <Spinner
          animation='border'
          role='status'
          className={`${colorClass}`}
          style={{
            ...dimensions,
            margin: 'auto',
            display: 'block',
            opacity: 0.8,
            ...pulseAnimation,
          }}
        />
        <div className="spinner-glow" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: dimensions.width,
          height: dimensions.height,
          borderRadius: '50%',
          filter: `blur(15px)`,
          background: isDarkMode ? 'rgba(157, 113, 219, 0.3)' : 'rgba(26, 41, 66, 0.2)',
          animation: 'pulse 1.5s infinite ease-in-out alternate',
        }}></div>
      </div>
      
      {text && (
        <div className="mt-3 loader-text" style={{ 
          color: isDarkMode ? '#e2e8f0' : '#1e293b',
          fontWeight: 500,
          animation: 'fadeIn 0.5s ease-out',
          fontSize: size === 'small' ? '0.9rem' : '1rem'
        }}>
          {text}
        </div>
      )}
      
      <style jsx="true">{`
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            opacity: 0.7;
          }
          100% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .text-accent {
          color: var(--accent-color) !important;
        }
      `}</style>
    </div>
  );
};

export default Loader;
