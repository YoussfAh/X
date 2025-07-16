import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/animations.css';

const StaggeredList = ({ 
  children,
  className = '',
  itemClassName = '',
  baseDelay = 50,
  staggerDelay = 50,
  threshold = 0.1
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold]);

  const childrenWithStagger = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) return child;
    
    const delay = baseDelay + (index * staggerDelay);
    const staggerItemClass = `stagger-item stagger-item-${index}`;
    
    return React.cloneElement(child, {
      className: `${child.props.className || ''} ${itemClassName} ${staggerItemClass}`,
      style: {
        ...child.props.style,
        opacity: 0,
        transform: 'translateY(20px)',
        transition: `opacity 0.5s ease-out ${delay}ms, transform 0.5s ease-out ${delay}ms`,
        ...(isVisible && { opacity: 1, transform: 'translateY(0)' })
      }
    });
  });

  return (
    <div ref={setRef} className={`staggered-list ${className}`}>
      {childrenWithStagger}
    </div>
  );
};

StaggeredList.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  itemClassName: PropTypes.string,
  baseDelay: PropTypes.number,
  staggerDelay: PropTypes.number,
  threshold: PropTypes.number
};

export default StaggeredList;