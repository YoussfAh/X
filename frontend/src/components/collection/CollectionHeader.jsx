import React from 'react';
import { Button, Breadcrumb } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './BreadcrumbStyles.css';

const CollectionHeader = ({ collection, handleBackClick, isDarkMode, themeColors }) => {
  if (!collection) return null;

  const backButtonStyle = {
    background: isDarkMode
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.05)',
    color: isDarkMode ? themeColors.dark.text : themeColors.light.text,
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontWeight: '500',
    transition: 'all 0.15s ease',
    boxShadow: isDarkMode
      ? '0 4px 8px rgba(0, 0, 0, 0.3)'
      : '0 2px 5px rgba(0, 0, 0, 0.08)',
  };

  const headerStyle = {
    color: isDarkMode ? themeColors.dark.text : themeColors.light.text,
    fontFamily: "'Poppins', sans-serif",
    fontWeight: '700',
    letterSpacing: '0.5px',
    textShadow: isDarkMode ? '0 2px 4px rgba(0, 0, 0, 0.3)' : 'none',
    transition: 'color 0.3s ease, text-shadow 0.3s ease',
  };

  const breadcrumbStyle = {
    background: isDarkMode
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.02)',
    padding: '0 20px',
    borderRadius: '8px',
    marginBottom: '8px',
    boxShadow: isDarkMode ? '0 4px 10px rgba(0, 0, 0, 0.2)' : 'none',
    transition: 'background 0.3s ease, box-shadow 0.3s ease',
    minHeight: '45px', // Changed from height to minHeight
    display: 'flex',
    alignItems: 'flex-start', // Changed to flex-start to align content to top
    paddingTop: '10px', // Add some top padding for better visual alignment
    paddingBottom: '10px', // Add some bottom padding as well
  };

  return (
    <>
      <Button
        className='btn my-3 d-flex align-items-center'
        style={backButtonStyle}
        onClick={handleBackClick}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = isDarkMode
            ? '0 6px 12px rgba(0, 0, 0, 0.4)'
            : '0 6px 12px rgba(0, 0, 0, 0.15)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = isDarkMode
            ? '0 4px 8px rgba(0, 0, 0, 0.3)'
            : '0 2px 5px rgba(0, 0, 0, 0.08)';
        }}
      >
        <FaArrowLeft className='me-2' /> Go Back
      </Button>
      {/* comment */}

      <div style={breadcrumbStyle}>
        <Breadcrumb style={{ margin: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
            Home
          </Breadcrumb.Item>
          {collection?.parentCollection?.name && (
            <Breadcrumb.Item
              linkAs={Link}
              linkProps={{ to: `/collections/${collection.parentCollection._id}` }}
            >
              {collection.parentCollection.name}
            </Breadcrumb.Item>
          )}
          <Breadcrumb.Item active>{collection.name}</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <h1 style={headerStyle} className='my-3'>
        {/* {collection.name} */}
      </h1>
    </>
  );
};

export default React.memo(CollectionHeader); 