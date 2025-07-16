import React, { useState } from 'react';
import { Card, Badge, Collapse, Button, ListGroup, Row, Col, Form, Modal } from 'react-bootstrap';
import { FaChevronDown, FaChevronUp, FaEdit, FaDumbbell, FaWeight, FaRedo, FaTrophy } from 'react-icons/fa';
import { format } from 'date-fns';
import BodyVisualization from './BodyVisualization';

const ExpandableSessionCard = ({ 
  session, 
  dayData,
  isDarkMode = false,
  amoledColors = {},
  onEditSession = null 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedName, setEditedName] = useState(session.name);

  const cardStyle = {
    backgroundColor: isDarkMode ? '#111111' : '#f8fafc',
    border: `1px solid ${isDarkMode ? '#333' : '#e5e7eb'}`,
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    marginBottom: '1rem'
  };

  const handleSaveEdit = () => {
    if (onEditSession) {
      onEditSession(session.id, { name: editedName });
    }
    setShowEditModal(false);
  };

  return (
    <>
      <Card style={cardStyle}>
        <Card.Body className="p-2 p-sm-3">
          {/* Session Header */}
          <div className="d-flex justify-content-between align-items-start mb-1">
            <div className="flex-grow-1 pe-2">
              <div className="d-flex align-items-center gap-1 mb-1">
                <h6 style={{ 
                  color: amoledColors.text, 
                  fontWeight: '600', 
                  fontSize: '0.9rem', 
                  margin: 0,
                  lineHeight: '1.2',
                  '@media (min-width: 576px)': {
                    fontSize: '0.95rem'
                  }
                }}>
                  {session.name}
                </h6>
                {onEditSession && (
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 ms-1"
                    onClick={() => setShowEditModal(true)}
                    style={{ color: amoledColors.textMuted }}
                  >
                    <FaEdit size={12} />
                  </Button>
                )}
              </div>
              <small style={{ 
                color: amoledColors.textMuted,
                fontSize: '0.7rem',
                display: 'block',
                '@media (min-width: 576px)': {
                  fontSize: '0.75rem'
                }
              }}>
                {format(new Date(session.startTime), 'MMM d, h:mm a')}
              </small>
            </div>
            
            <div className="d-flex flex-column align-items-end">
              <Badge bg="success" className="mb-1" style={{ 
                fontSize: '0.65rem',
                padding: '0.25em 0.5em'
              }}>
                {Math.round((session.maxWeight || 0) / 2.205)} kg max
              </Badge>
              <Button
                variant="link"
                size="sm"
                className="p-0"
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ color: amoledColors.textSecondary }}
              >
                {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
              </Button>
            </div>
          </div>

          {/* Quick Stats with Progress Indicators */}
          <div className="mb-1">
            <Row className="g-1 text-center">
              <Col xs={3}>
                <div style={{ fontSize: '0.7rem', color: amoledColors.textMuted }}>Exercises</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: amoledColors.text }}>
                  {session.exercises.length}
                </div>
              </Col>
              <Col xs={3}>
                <div style={{ fontSize: '0.7rem', color: amoledColors.textMuted }}>Sets</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: amoledColors.text }}>
                  {session.totalSets}
                </div>
              </Col>
              <Col xs={6}>
                <div style={{ fontSize: '0.7rem', color: amoledColors.textMuted }}>Volume</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: amoledColors.text }}>
                  {Math.round(session.totalVolume / 2.205)} kg
                </div>
              </Col>
            </Row>
          </div>



          {/* Expandable Details */}
          <Collapse in={isExpanded}>
            <div>
              <hr style={{ borderColor: isDarkMode ? '#333' : '#e5e7eb', margin: '1rem 0' }} />
              
              {/* Body Visualization */}
              {session.muscleGroups.length > 0 && (
                <div className="mb-4">
                  <BodyVisualization
                    muscleGroups={session.muscleGroups}
                    size="small"
                    showLabels={true}
                    title="Muscles Worked Today"
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}

              {/* Exercise Details */}
              <div>
                <h6 style={{ color: amoledColors.text, marginBottom: '1rem' }}>
                  <FaDumbbell className="me-2" />
                  Exercise Breakdown ({session.exercises.length} exercises)
                </h6>
                
                <ListGroup variant="flush">
                    {session.exercises.map((exercise, idx) => (
                      <ListGroup.Item
                        key={idx}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderBottom: `1px solid ${isDarkMode ? '#333' : '#e5e7eb'}`,
                          padding: '0.75rem 0'
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div style={{ color: amoledColors.text, fontWeight: '600', fontSize: '0.9rem' }}>
                              {exercise.product?.name || 'Unknown Exercise'}
                            </div>
                            <div style={{ color: amoledColors.textMuted, fontSize: '0.8rem' }}>
                              {exercise.sets?.length || 0} sets
                            </div>
                          </div>
                          
                          <div className="text-end">
                            <div style={{ color: amoledColors.textSecondary, fontSize: '0.8rem' }}>
                              <FaWeight className="me-1" size={10} />
                              {exercise.sets?.length > 0 ? 
                                `${Math.round(Math.max(...exercise.sets.map(s => s.weight || 0)) / 2.205)} kg max` : 
                                '0 kg'
                              }
                            </div>
                            <div style={{ color: amoledColors.textMuted, fontSize: '0.75rem' }}>
                              <FaRedo className="me-1" size={10} />
                              {exercise.sets?.reduce((sum, set) => sum + (set.reps || 0), 0) || 0} total reps
                            </div>
                          </div>
                        </div>

                        {/* Set Details */}
                        {exercise.sets && exercise.sets.length > 0 && (
                          <div className="mt-2">
                            <Row className="g-1">
                              {exercise.sets.map((set, setIdx) => (
                                <Col xs={6} sm={4} md={3} key={setIdx}>
                                  <div 
                                    style={{
                                      backgroundColor: isDarkMode ? '#222' : '#f1f5f9',
                                      borderRadius: '6px',
                                      padding: '0.4rem',
                                      textAlign: 'center',
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    <div style={{ color: amoledColors.text, fontWeight: '600' }}>
                                      Set {setIdx + 1}
                                    </div>
                                    <div style={{ color: amoledColors.textSecondary }}>
                                      {Math.round((set.weight || 0) / 2.205)}kg × {set.reps || 0}
                                    </div>
                                  </div>
                                </Col>
                              ))}
                            </Row>
                          </div>
                        )}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>

                  {/* Session Summary */}
                  {session.personalRecords > 0 && (
                    <div className="mt-3 p-2" style={{ 
                      backgroundColor: isDarkMode ? '#1a1a1a' : '#f8fafc',
                      borderRadius: '8px',
                      border: `1px solid ${isDarkMode ? '#333' : '#e5e7eb'}`
                    }}>
                      <div className="text-center">
                        <div style={{ color: amoledColors.chartColors.green, fontSize: '0.85rem' }}>
                          <FaTrophy className="me-1" />
                          {session.personalRecords} Personal Record{session.personalRecords > 1 ? 's' : ''} Set! 🎉
                        </div>
                      </div>
                    </div>
                  )}
                </div>
            </div>
          </Collapse>
        </Card.Body>
      </Card>

      {/* Edit Session Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Session Name</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Session Name</Form.Label>
              <Form.Control
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Enter session name"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveEdit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ExpandableSessionCard; 