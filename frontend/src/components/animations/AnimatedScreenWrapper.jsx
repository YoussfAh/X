import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import PageTransition from './PageTransition';
import ContentLoader from './ContentLoader';
import '../../assets/styles/animations.css';

const AnimatedScreenWrapper = ({
  children, 
  isLoading = false,
  loaderType = 'card',
  cardCount = 4,
  rowCount = 5,
  error = null,
  className = '',
  skipAnimation = false
}) => {
  const [showContent, setShowContent] = useState(!isLoading);
  const initialRender = useRef(true);
  
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      if (!isLoading) {
        setShowContent(true);
        return;
      }
    }

    if (!isLoading) {
      setShowContent(true);
    } else {
      setShowContent(false);
    }
  }, [isLoading]);

  if (skipAnimation) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      {isLoading ? (
        <div style={{ opacity: 1 }}>
          <ContentLoader 
            type={loaderType} 
            cardCount={cardCount} 
            rowCount={rowCount} 
          />
        </div>
      ) : error ? (
        <div style={{ opacity: 1 }}>
          <div className="alert alert-danger">{error}</div>
        </div>
      ) : (
        <div 
          style={{ 
            opacity: showContent ? 1 : 0,
            transition: 'opacity 0.15s ease-out',
            willChange: 'opacity'
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

AnimatedScreenWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  isLoading: PropTypes.bool,
  loaderType: PropTypes.oneOf(['card', 'table', 'form']),
  cardCount: PropTypes.number,
  rowCount: PropTypes.number,
  error: PropTypes.string,
  className: PropTypes.string,
  skipAnimation: PropTypes.bool
};

export default AnimatedScreenWrapper;