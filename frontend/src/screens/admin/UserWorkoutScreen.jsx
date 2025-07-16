import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const UserWorkoutScreen = () => (
  <Container fluid className='py-5 text-center px-1'>
    <h2>User Workout Tracking Disabled</h2>
    <p>
      This page is no longer available or has been removed by the administrator.
    </p>
    <LinkContainer to='/admin/workouts'>
      <Button variant='primary' className='mt-3'>
        Back to Workout Dashboard
      </Button>
    </LinkContainer>
  </Container>
);

export default UserWorkoutScreen;
