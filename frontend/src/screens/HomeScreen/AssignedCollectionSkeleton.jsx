import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const AssignedCollectionSkeleton = () => {
  const isDarkMode =
    document.documentElement.getAttribute('data-theme') === 'dark';

  const skeletonCardStyle = {
    backgroundColor: isDarkMode ? '#333' : '#e0e0e0',
    borderRadius: '15px',
    height: '300px',
    width: '100%',
  };

  const skeletonTitleStyle = {
    backgroundColor: isDarkMode ? '#333' : '#e0e0e0',
    borderRadius: '8px',
    height: '40px',
    width: '60%',
    margin: '0 auto 3rem auto',
  };

  return (
    <Container
      fluid
      className='px-1'
      style={{ maxWidth: '1200px', padding: '2rem 0', minHeight: '40vh' }}
    >
      <div style={skeletonTitleStyle} />
      <Row>
        <Col md={6} className='mb-4'>
          <div style={skeletonCardStyle} />
        </Col>
        <Col md={6} className='mb-4'>
          <div style={skeletonCardStyle} />
        </Col>
      </Row>
    </Container>
  );
};

export default AssignedCollectionSkeleton;
