import React, { useMemo } from 'react';
import { Row, Col } from 'react-bootstrap';
import CollectionCard from '../CollectionCard';

const SubCollectionList = ({ subcollections, isDarkMode, handleSubCollectionClick, needsAccessCode, isMobile }) => {
  const styles = useMemo(() => ({
    heading: {
      fontWeight: '600',
      fontSize: isMobile ? '1.3rem' : '1.8rem', // Responsive font size
      color: isDarkMode ? '#E0E0E0' : '#333',
      marginBottom: '1.5rem',
      paddingLeft: '20px', // Align with main content padding
    },
    card: {
      backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)',
      borderRadius: '12px',
      overflow: 'hidden',
      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.05)',
      boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.12)' : '0 4px 12px rgba(0, 0, 0, 0.03)',
      height: '100%'
    },
    link: {
      textDecoration: 'none',
      display: 'block',
      height: '100%',
      cursor: 'pointer'
    }
  }), [isDarkMode]);

  return (
    <div>
      <h2 style={styles.heading}>Sub-Collections</h2>
      <Row>
        {subcollections.map((sub) => (
          <Col key={sub._id} sm={12} md={6} lg={4} className='mb-4'>
            <div
              onClick={(e) => handleSubCollectionClick(e, sub)}
              style={styles.link}
            >
              <CollectionCard
                collection={sub}
                cardStyle={styles.card}
                showLock={needsAccessCode(sub)}
              />
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default React.memo(SubCollectionList); 