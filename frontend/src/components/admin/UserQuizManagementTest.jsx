import React from 'react';
import { Card, Alert } from 'react-bootstrap';

const UserQuizManagementTest = ({ user }) => {
  console.log('🔍 Test Quiz Component Loaded!', { user: user?.name });

  return (
    <Card
      style={{
        backgroundColor: '#ff0000',
        border: '3px solid #000000',
        margin: '20px 0',
        minHeight: '200px',
      }}
    >
      <Card.Header style={{ backgroundColor: '#000000', color: 'white' }}>
        <h3>🎯 QUIZ MANAGEMENT TEST - THIS SHOULD BE VISIBLE!</h3>
      </Card.Header>
      <Card.Body>
        <Alert variant='success'>
          <h4>✅ Quiz Management Component is Working!</h4>
          <p>User: {user?.name || 'Loading...'}</p>
          <p>Pending Quizzes: {user?.pendingQuizzes?.length || 0}</p>
          <p>This is the quiz management section where you can:</p>
          <ul>
            <li>View future quiz assignments</li>
            <li>Remove scheduled quizzes</li>
            <li>Assign new quizzes</li>
            <li>View completed quiz results</li>
          </ul>
        </Alert>
      </Card.Body>
    </Card>
  );
};

export default UserQuizManagementTest;
