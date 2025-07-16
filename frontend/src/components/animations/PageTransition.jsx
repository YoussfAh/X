import React from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/animations.css';

const PageTransition = ({ children, className = '', skipAnimation = false }) => {
  if (skipAnimation) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div 
      className={className}
      style={{ 
        opacity: 1,
        willChange: 'opacity'
      }}
    >
      {children}
    </div>
  );
};

PageTransition.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  skipAnimation: PropTypes.bool
};

export default PageTransition;

