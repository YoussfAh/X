import React from 'react';
import PropTypes from 'prop-types';
import Loader from '../Loader';
import '../../assets/styles/animations.css';

const ContentLoader = ({ 
  loading, 
  children, 
  type = 'default',
  height = '200px',
  width = '100%' 
}) => {
  if (!loading) return children;

  const getLoader = () => {
    switch(type) {
      case 'table':
        return (
          <div className="table-skeleton-loader">
            <div className="skeleton-header"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton-row">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="skeleton-cell"></div>
                ))}
              </div>
            ))}
          </div>
        );
      case 'cards':
        return (
          <div className="cards-skeleton-loader">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-card-img"></div>
                <div className="skeleton-card-title"></div>
                <div className="skeleton-card-text"></div>
              </div>
            ))}
          </div>
        );
      case 'form':
        return (
          <div className="form-skeleton-loader">
            <div className="skeleton-input"></div>
            <div className="skeleton-input"></div>
            <div className="skeleton-textarea"></div>
            <div className="skeleton-button"></div>
          </div>
        );
      default:
        return (
          <div className="default-loader-container">
            <Loader />
          </div>
        );
    }
  };

  return (
    <div 
      className="content-loader"
      style={{ 
        height, 
        width,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {getLoader()}
    </div>
  );
};

ContentLoader.propTypes = {
  loading: PropTypes.bool.isRequired,
  children: PropTypes.node,
  type: PropTypes.oneOf(['default', 'table', 'cards', 'form']),
  height: PropTypes.string,
  width: PropTypes.string
};

export default ContentLoader;

