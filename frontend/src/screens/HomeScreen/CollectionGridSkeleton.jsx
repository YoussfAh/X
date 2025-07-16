import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import '../../assets/styles/index.css'; // Ensure animations are available

const CollectionCardSkeleton = ({ isDarkMode }) => {
  const skeletonStyle = {
    backgroundColor: isDarkMode ? '#333' : '#e0e0e0',
    borderRadius: '15px',
    height: '350px', // A fixed height for skeletons
    width: '100%',
    // animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  };

  return <div style={skeletonStyle} />;
};

const CollectionGridSkeleton = () => {
  const isDarkMode =
    document.documentElement.getAttribute('data-theme') === 'dark';
  const [isMobile] = useState(window.innerWidth < 768);

  // A simplified layout for the skeleton
  const skeletonLayout = [
    { key: 1, cols: [12] },
    { key: 2, cols: [6, 6] },
    { key: 3, cols: [4, 8] },
    { key: 4, cols: [12] },
  ];

  return (
    <Container
      className={isMobile ? 'px-2' : 'px-md-4 px-2'}
      style={{
        minHeight: '40vh',
        paddingTop: '2rem',
        paddingBottom: '2rem',
      }}
    >
      {skeletonLayout.map((row) => (
        <Row key={row.key} className='mb-4'>
          {row.cols.map((colSize, index) => (
            <Col key={index} md={colSize} className='mb-4 mb-md-0'>
              <CollectionCardSkeleton isDarkMode={isDarkMode} />
            </Col>
          ))}
        </Row>
      ))}
    </Container>
  );
};

export default CollectionGridSkeleton;
