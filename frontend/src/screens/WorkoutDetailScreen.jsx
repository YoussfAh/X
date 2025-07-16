import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Badge,
  Button,
  ListGroup,
  Container,
} from 'react-bootstrap';
import { FaDumbbell } from 'react-icons/fa';
import {
  FaArrowLeft,
  FaWeight,
  FaRunning,
  FaCalendarAlt,
  FaUser,
  FaClipboardList,
} from 'react-icons/fa';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { format } from 'date-fns';
import { useGetWorkoutEntryDetailsQuery } from '../slices/workoutApiSlice';
import Meta from '../components/Meta';

const WorkoutDetailScreen = () => {
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );

  const { id } = useParams();
  const { data: entry, isLoading, error } = useGetWorkoutEntryDetailsQuery(id);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          setIsDarkMode(
            document.documentElement.getAttribute('data-theme') === 'dark'
          );
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Function to style based on feeling
  const getFeelingStyling = (feeling) => {
    switch (feeling) {
      case 'easy':
        return {
          bg: isDarkMode ? 'success' : 'success',
          text: 'Easy',
        };
      case 'moderate':
        return {
          bg: isDarkMode ? 'info' : 'info',
          text: 'Moderate',
        };
      case 'hard':
        return {
          bg: isDarkMode ? 'warning' : 'warning',
          text: 'Hard',
        };
      case 'extreme':
        return {
          bg: isDarkMode ? 'danger' : 'danger',
          text: 'Extreme',
        };
      default:
        return {
          bg: isDarkMode ? 'secondary' : 'secondary',
          text: 'Not Specified',
        };
    }
  };

  const cardStyle = {
    backgroundColor: isDarkMode ? '#1e293b' : '#fff',
    color: isDarkMode ? '#e2e8f0' : '#334155',
    borderRadius: '0.5rem',
    boxShadow: isDarkMode
      ? '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
      : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    border: 'none',
  };

  // Calculate workout statistics for this entry
  const calculateStats = (entry) => {
    if (!entry || !entry.sets || !entry.sets.length) {
      return { totalSets: 0, totalWeight: 0, avgReps: 0, maxWeight: 0 };
    }

    let totalReps = 0;
    let totalWeight = 0;
    let maxWeight = 0;

    entry.sets.forEach((set) => {
      if (set.weight) {
        totalWeight += set.weight;
        maxWeight = Math.max(maxWeight, set.weight);
      }
      if (set.reps) {
        totalReps += set.reps;
      }
    });

    return {
      totalSets: entry.sets.length,
      totalWeight: Math.round(totalWeight),
      avgReps: Math.round(totalReps / entry.sets.length),
      maxWeight: maxWeight,
    };
  };

  return (
    <Container fluid className='py-3 px-1'>
      <Meta title='Workout Details' />
      <Link to='/workout-dashboard' className='btn btn-light my-3'>
        <FaArrowLeft className='me-1' /> Back to Dashboard
      </Link>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>
          {error?.data?.message ||
            error.error ||
            'Failed to load workout details'}
        </Message>
      ) : entry ? (
        <>
          <Row>
            <Col>
              <h2 className='mb-4 d-flex align-items-center'>
                <FaDumbbell className='me-2' style={{ color: '#6e44b2' }} />
                Workout Details
              </h2>
            </Col>
          </Row>

          <Row>
            <Col md={8}>
              <Card className='mb-4' style={cardStyle}>
                <Card.Header
                  style={{
                    backgroundColor: isDarkMode ? '#334155' : '#f8fafc',
                    borderBottom: isDarkMode
                      ? '1px solid #475569'
                      : '1px solid #e2e8f0',
                  }}
                >
                  <div className='d-flex justify-content-between align-items-center'>
                    <h5 className='mb-0 d-flex align-items-center'>
                      <FaClipboardList className='me-2' /> Entry Information
                    </h5>
                    <Badge
                      bg={getFeelingStyling(entry.feeling).bg}
                      className='px-3 py-2'
                    >
                      {getFeelingStyling(entry.feeling).text}
                    </Badge>
                  </div>
                </Card.Header>

                <Card.Body>
                  <Row className='mb-3'>
                    <Col sm={4} className='fw-bold d-flex align-items-center'>
                      <FaCalendarAlt
                        className='me-2'
                        style={{ color: '#6e44b2' }}
                      />{' '}
                      Date:
                    </Col>
                    <Col sm={8}>
                      {format(new Date(entry.date), 'MMMM d, yyyy (h:mm a)')}
                    </Col>
                  </Row>

                  <Row className='mb-3'>
                    <Col sm={4} className='fw-bold'>
                      Exercise:
                    </Col>
                    <Col sm={8} className='d-flex align-items-center'>
                      {entry.product?.image && (
                        <img
                          src={entry.product.image}
                          alt={entry.product?.name}
                          style={{
                            width: '50px',
                            height: '50px',
                            objectFit: 'cover',
                            marginRight: '10px',
                            borderRadius: '5px',
                          }}
                        />
                      )}
                      {entry.product?.name}
                    </Col>
                  </Row>

                  <Row className='mb-3'>
                    <Col sm={4} className='fw-bold'>
                      Collection:
                    </Col>
                    <Col sm={8}>
                      {entry.parentCollection?.name
                        ? `${entry.parentCollection.name} > ${entry.collectionId?.name}`
                        : entry.collectionId?.name ||
                          'Not part of a collection'}
                    </Col>
                  </Row>

                  {entry.comments && (
                    <Row className='mb-3'>
                      <Col sm={4} className='fw-bold'>
                        Comments:
                      </Col>
                      <Col sm={8}>
                        <div
                          className='p-3 rounded'
                          style={{
                            backgroundColor: isDarkMode ? '#334155' : '#f8fafc',
                            border: isDarkMode
                              ? '1px solid #475569'
                              : '1px solid #e2e8f0',
                          }}
                        >
                          {entry.comments}
                        </div>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>

              <Card className='mb-4' style={cardStyle}>
                <Card.Header
                  style={{
                    backgroundColor: isDarkMode ? '#334155' : '#f8fafc',
                    borderBottom: isDarkMode
                      ? '1px solid #475569'
                      : '1px solid #e2e8f0',
                  }}
                >
                  <h5 className='mb-0 d-flex align-items-center'>
                    <FaDumbbell className='me-2' /> Sets Details
                  </h5>
                </Card.Header>

                <Card.Body>
                  <ListGroup variant='flush'>
                    {entry.sets && entry.sets.length > 0 ? (
                      entry.sets.map((set, idx) => (
                        <ListGroup.Item
                          key={idx}
                          style={{
                            backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                            color: isDarkMode ? '#e2e8f0' : '#334155',
                            borderColor: isDarkMode ? '#475569' : '#e2e8f0',
                          }}
                        >
                          <Row className='align-items-center'>
                            <Col xs={2} sm={1} className='text-center'>
                              <Badge
                                bg={isDarkMode ? 'dark' : 'secondary'}
                                className='rounded-circle px-2 py-2'
                              >
                                {idx + 1}
                              </Badge>
                            </Col>
                            <Col
                              xs={5}
                              sm={4}
                              className='d-flex align-items-center'
                            >
                              <FaWeight
                                className='me-2'
                                style={{ color: '#6e44b2' }}
                              />
                              <span className='fw-bold'>{set.weight || 0}</span>
                              <span className='ms-1 text-muted'>lbs</span>
                            </Col>
                            <Col
                              xs={5}
                              sm={4}
                              className='d-flex align-items-center'
                            >
                              <FaRunning
                                className='me-2'
                                style={{ color: '#6e44b2' }}
                              />
                              <span className='fw-bold'>{set.reps || 0}</span>
                              <span className='ms-1 text-muted'>reps</span>
                            </Col>
                            <Col sm={3} className='d-none d-sm-block'>
                              {set.notes && (
                                <small className='text-muted'>
                                  {set.notes}
                                </small>
                              )}
                            </Col>
                          </Row>
                          {/* Mobile-only notes section */}
                          {set.notes && (
                            <Row className='d-sm-none mt-2'>
                              <Col>
                                <small className='text-muted'>
                                  {set.notes}
                                </small>
                              </Col>
                            </Row>
                          )}
                        </ListGroup.Item>
                      ))
                    ) : (
                      <ListGroup.Item
                        style={{
                          backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                          color: isDarkMode ? '#e2e8f0' : '#334155',
                        }}
                      >
                        No sets data available for this workout entry
                      </ListGroup.Item>
                    )}
                  </ListGroup>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className='mb-4' style={cardStyle}>
                <Card.Header
                  style={{
                    backgroundColor: isDarkMode ? '#334155' : '#f8fafc',
                    borderBottom: isDarkMode
                      ? '1px solid #475569'
                      : '1px solid #e2e8f0',
                  }}
                >
                  <h5 className='mb-0'>Workout Stats</h5>
                </Card.Header>
                <Card.Body>
                  <Row className='mb-4 text-center'>
                    <Col
                      xs={6}
                      className='border-end'
                      style={{
                        borderColor: isDarkMode ? '#475569' : '#e2e8f0',
                      }}
                    >
                      <div className='mb-2' style={{ color: '#6e44b2' }}>
                        <FaDumbbell size={24} />
                      </div>
                      <h6 className='mb-1'>Total Sets</h6>
                      <h3 className='mb-0'>
                        {calculateStats(entry).totalSets}
                      </h3>
                    </Col>
                    <Col xs={6}>
                      <div className='mb-2' style={{ color: '#6e44b2' }}>
                        <FaWeight size={24} />
                      </div>
                      <h6 className='mb-1'>Total Weight</h6>
                      <h3 className='mb-0'>
                        {calculateStats(entry).totalWeight}
                        <small className='ms-1 fs-6'>lbs</small>
                      </h3>
                    </Col>
                  </Row>
                  <Row className='text-center'>
                    <Col
                      xs={6}
                      className='border-end'
                      style={{
                        borderColor: isDarkMode ? '#475569' : '#e2e8f0',
                      }}
                    >
                      <div className='mb-2' style={{ color: '#6e44b2' }}>
                        <FaRunning size={24} />
                      </div>
                      <h6 className='mb-1'>Avg Reps/Set</h6>
                      <h3 className='mb-0'>{calculateStats(entry).avgReps}</h3>
                    </Col>
                    <Col xs={6}>
                      <div className='mb-2' style={{ color: '#6e44b2' }}>
                        <FaWeight size={24} />
                      </div>
                      <h6 className='mb-1'>Max Weight</h6>
                      <h3 className='mb-0'>
                        {calculateStats(entry).maxWeight}
                        <small className='ms-1 fs-6'>lbs</small>
                      </h3>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card style={cardStyle}>
                <Card.Header
                  style={{
                    backgroundColor: isDarkMode ? '#334155' : '#f8fafc',
                    borderBottom: isDarkMode
                      ? '1px solid #475569'
                      : '1px solid #e2e8f0',
                  }}
                >
                  <h5 className='mb-0'>Actions</h5>
                </Card.Header>
                <Card.Body>
                  <div className='d-grid gap-2'>
                    <Link
                      to={`/product/${entry.product?._id}`}
                      style={{
                        color: isDarkMode ? '#9d4edd' : '#7c4dff',
                        textDecoration: 'none',
                        fontWeight: '500',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      View Exercise
                    </Link>
                    {entry.collectionId && (
                      <Link
                        to={`/collections/${entry.collectionId?._id}`}
                        className='btn btn-outline-secondary'
                      >
                        View Collection
                      </Link>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <Message variant='danger'>Workout entry not found</Message>
      )}
    </Container>
  );
};

export default WorkoutDetailScreen;
