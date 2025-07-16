import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Alert } from 'react-bootstrap';
import { FaArrowRight } from 'react-icons/fa';

const AdminCarouselScreen = () => {
  const navigate = useNavigate();

  // Automatically redirect to the system settings page after a short delay
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      navigate('/admin/system-settings');
    }, 3000);

    return () => clearTimeout(redirectTimer);
  }, [navigate]);

  return (
    <Container fluid className='py-5 px-1'>
      <Alert variant='info'>
        <Alert.Heading>Carousel Management Has Moved</Alert.Heading>
        <p>
          The carousel management functionality is now part of the System
          Settings. You will be redirected automatically in a few seconds.
        </p>
        <hr />
        <div className='d-flex justify-content-end'>
          <button
            className='btn btn-primary'
            onClick={() => navigate('/admin/system-settings')}
          >
            Go to System Settings Now <FaArrowRight className='ms-2' />
          </button>
        </div>
      </Alert>
    </Container>
  );
};

export default AdminCarouselScreen;
