import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/animations.css';

const FadeIn = ({ 
  children, 
  className = '', 
  delay = 0, 
  duration = 500, 
  direction = 'up', 
  distance = 20,
  threshold = 0.2,
  immediate = false, // New prop to support immediate rendering
  fast = false // New prop for faster animations
}) => {
  // Check if this page has been viewed before to optimize animations
  const [hasVisitedBefore] = useState(() => {
    const pageVisited = localStorage.getItem(`visited_${window.location.pathname}`);
    return pageVisited === 'true';
  });

  const [isVisible, setIsVisible] = useState(immediate || hasVisitedBefore);
  const [ref, setRef] = useState(null);

  // Store page visit in localStorage
  useEffect(() => {
    localStorage.setItem(`visited_${window.location.pathname}`, 'true');
  }, []);

  useEffect(() => {
    if (!ref) return;
    
    // If immediate or previously visited, skip the animation delay
    if (immediate || hasVisitedBefore) {
      setIsVisible(true);
      return;
    }
    
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        }, 
        { threshold: fast ? 0.1 : threshold } // Lower threshold for faster animations
      );
      
      observer.observe(ref);
      
      return () => observer.disconnect();
    }, fast ? Math.min(delay, 50) : delay); // Cap delay at 50ms if fast mode
    
    return () => clearTimeout(timer);
  }, [ref, delay, threshold, immediate, hasVisitedBefore, fast]);

  // Skip animations completely if immediate or has visited before
  if ((immediate || hasVisitedBefore) && fast) {
    return <div className={className}>{children}</div>;
  }

  let transform = '';
  switch (direction) {
    case 'up':
      transform = `translateY(${fast ? Math.min(distance, 10) : distance}px)`;
      break;
    case 'down':
      transform = `translateY(-${fast ? Math.min(distance, 10) : distance}px)`;
      break;
    case 'left':
      transform = `translateX(${fast ? Math.min(distance, 10) : distance}px)`;
      break;
    case 'right':
      transform = `translateX(-${fast ? Math.min(distance, 10) : distance}px)`;
      break;
    default:
      transform = `translateY(${fast ? Math.min(distance, 10) : distance}px)`;
  }

  // Adjust animation timing for products
  const actualDuration = fast ? Math.min(duration, 300) : duration;

  return (
    <div
      ref={setRef}
      className={`fade-in-element ${isVisible ? 'visible' : ''} ${className}`}
      style={{
        opacity: 0,
        transform,
        transition: `opacity ${actualDuration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${actualDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        willChange: 'opacity, transform',
        ...(isVisible && { opacity: 1, transform: 'translate(0, 0)' })
      }}
    >
      {children}
    </div>
  );
};

FadeIn.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  delay: PropTypes.number,
  duration: PropTypes.number,
  direction: PropTypes.oneOf(['up', 'down', 'left', 'right']),
  distance: PropTypes.number,
  threshold: PropTypes.number,
  immediate: PropTypes.bool,
  fast: PropTypes.bool
};

export default FadeIn;