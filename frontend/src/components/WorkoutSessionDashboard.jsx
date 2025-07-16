import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Modal, Form } from 'react-bootstrap';
import { FaDumbbell, FaPlay, FaPause, FaStop, FaPlus } from 'react-icons/fa';
import { format } from 'date-fns';
import {
  useGetActiveSessionQuery,
  useCreateWorkoutSessionMutation,
  useCompleteWorkoutSessionMutation
} from '../slices/workoutSessionApiSlice';
import Meta from './Meta';

const WorkoutSessionDashboard = () => {
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    name: '',
    workoutType: 'strength',
    location: 'gym'
  });

  const { data: activeSession } = useGetActiveSessionQuery();
  const [createSession] = useCreateWorkoutSessionMutation();
  const [completeSession] = useCompleteWorkoutSessionMutation();

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await createSession(sessionForm).unwrap();
      setShowSessionModal(false);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleCompleteSession = async () => {
    if (activeSession) {
      try {
        await completeSession({ 
          id: activeSession._id, 
          data: { rating: 3 } 
        }).unwrap();
      } catch (error) {
        console.error('Failed to complete session:', error);
      }
    }
  };

  return (
    <>
      <Meta title="Workout Sessions" />
      <Container className="py-3">
        <h1 className="mb-4">Workout Sessions</h1>
        
        {!activeSession ? (
          <Card>
            <Card.Body className="text-center py-4">
              <p>No active workout session</p>
              <Button onClick={() => setShowSessionModal(true)}>
                <FaPlus className="me-2" />
                Start Workout
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <Card>
            <Card.Header>
              <h5>{activeSession.name}</h5>
            </Card.Header>
            <Card.Body>
              <p>Duration: {activeSession.duration || 0} minutes</p>
              <p>Exercises: {activeSession.exercises?.length || 0}</p>
              <Button variant="success" onClick={handleCompleteSession}>
                <FaStop className="me-2" />
                Complete Workout
              </Button>
            </Card.Body>
          </Card>
        )}

        <Modal show={showSessionModal} onHide={() => setShowSessionModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Start New Workout</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleCreateSession}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Workout Name</Form.Label>
                <Form.Control
                  type="text"
                  value={sessionForm.name}
                  onChange={(e) => setSessionForm({...sessionForm, name: e.target.value})}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Type</Form.Label>
                <Form.Select
                  value={sessionForm.workoutType}
                  onChange={(e) => setSessionForm({...sessionForm, workoutType: e.target.value})}
                >
                  <option value="strength">Strength</option>
                  <option value="cardio">Cardio</option>
                </Form.Select>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowSessionModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Start Workout
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </>
  );
};

export default WorkoutSessionDashboard; 