import React, { useState } from 'react';
import {
  Card,
  Button,
  Badge,
  Modal,
  Form,
  Table,
  Row,
  Col,
  Accordion,
  Alert,
  ListGroup,
  Spinner,
} from 'react-bootstrap';
import {
  FaPlus,
  FaTrash,
  FaEye,
  FaQuestionCircle,
  FaClock,
  FaLayerGroup,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaDownload,
  FaCalendarAlt,
  FaStopwatch,
  FaBan,
} from 'react-icons/fa';
import { format, formatDistanceToNow } from 'date-fns';
import {
  useGetFutureQuizAssignmentsQuery,
  useRemoveFutureQuizAssignmentMutation,
} from '../../slices/quizApiSlice';
import './UserQuizManagement.css';

const UserQuizManagement = ({
  user,
  quizzes,
  userQuizResults,
  onAssignQuiz,
  onUnassignQuiz,
  onUnassignSpecificQuiz,
  isLoading,
}) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  // Fetch future quiz assignments
  const {
    data: futureAssignments = [],
    isLoading: isLoadingFuture,
    error: futureError,
    refetch: refetchFuture,
  } = useGetFutureQuizAssignmentsQuery(user?._id, {
    skip: !user?._id,
  });

  const [removeFutureAssignment, { isLoading: isRemovingFuture }] =
    useRemoveFutureQuizAssignmentMutation();

  const handleRemoveFutureAssignment = async (quizId) => {
    if (!user?._id || !quizId) return;

    try {
      await removeFutureAssignment({ userId: user._id, quizId }).unwrap();
      refetchFuture(); // Refresh the future assignments list
    } catch (error) {
      console.error('Error removing future assignment:', error);
    }
  };

  const downloadQuizReport = () => {
    if (!userQuizResults || userQuizResults.length === 0) {
      alert('No quiz results available for download');
      return;
    }

    const generateReport = () => {
      let report = `QUIZ RESULTS REPORT\n`;
      report += `User: ${user.name} (${user.email})\n`;
      report += `Generated: ${format(new Date(), 'PPpp')}\n`;
      report += `Total Quizzes Completed: ${userQuizResults.length}\n`;
      report += `\n${'='.repeat(80)}\n\n`;

      userQuizResults.forEach((result, index) => {
        const quiz = quizzes?.find((q) => q._id === result.quizId) || {};

        report += `QUIZ ${index + 1}: ${
          result.quizName || quiz.name || 'Unknown Quiz'
        }\n`;
        report += `Completed: ${format(
          new Date(result.submittedAt),
          'PPpp'
        )}\n`;
        report += `Quiz ID: ${result.quizId}\n`;

        if (
          result.assignedCollections &&
          result.assignedCollections.length > 0
        ) {
          report += `Collections Assigned: ${result.assignedCollections
            .map((c) => c.collectionName)
            .join(', ')}\n`;
        }

        report += `\nQUESTIONS & ANSWERS:\n`;
        report += `${'-'.repeat(40)}\n`;

        if (result.answers && result.answers.length > 0) {
          result.answers.forEach((answer, qIndex) => {
            report += `${qIndex + 1}. ${answer.question}\n`;
            report += `   Type: ${answer.questionType || 'N/A'}\n`;
            report += `   Answer: ${answer.answer}\n\n`;
          });
        } else {
          report += `No detailed answers recorded.\n\n`;
        }

        report += `${'-'.repeat(80)}\n\n`;
      });

      return report;
    };

    try {
      const reportContent = generateReport();
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quiz-report-${user.name.replace(
        /[^a-zA-Z0-9]/g,
        '_'
      )}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating quiz report:', error);
      alert('Error generating quiz report. Please try again.');
    }
  };

  const handleAssignQuiz = async () => {
    if (!selectedQuizId) return;
    await onAssignQuiz(selectedQuizId);
    setShowAssignModal(false);
    setSelectedQuizId('');
  };

  const formatQuestionTypes = (questions) => {
    if (!questions || questions.length === 0) return 'No questions';

    const typeCounts = questions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(typeCounts)
      .map(([type, count]) => `${count} ${type.replace('-', ' ')}`)
      .join(', ');
  };

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'multiple-choice':
        return '📋';
      case 'true-false':
        return '✓/✗';
      case 'text':
        return '📝';
      case 'informational':
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  const renderFutureAssignment = (assignment, index) => {
    const quiz = assignment.quiz;
    if (!quiz) return null;

    const scheduledDate = new Date(assignment.scheduledFor);
    const referenceDate = new Date(assignment.referenceDate);
    const timeUntil = formatDistanceToNow(scheduledDate, { addSuffix: true });

    return (
      <Card key={index} className='mb-3 border-warning'>
        <Card.Header className='d-flex justify-content-between align-items-center bg-warning bg-opacity-10'>
          <div>
            <h6 className='mb-1 d-flex align-items-center'>
              <FaCalendarAlt className='me-2 text-warning' />
              {quiz.name}
            </h6>
            <small className='text-muted'>
              Scheduled for: {format(scheduledDate, 'PPpp')} ({timeUntil})
            </small>
          </div>
          <Button
            variant='outline-danger'
            size='sm'
            onClick={() => handleRemoveFutureAssignment(quiz._id)}
            disabled={isRemovingFuture}
            title='Remove this future assignment'
          >
            {isRemovingFuture ? (
              <Spinner animation='border' size='sm' />
            ) : (
              <FaBan />
            )}
          </Button>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <div className='d-flex align-items-center mb-2'>
                <FaStopwatch className='me-2 text-info' />
                <span>
                  <strong>Delay:</strong> {assignment.delayAmount}{' '}
                  {assignment.delayUnit}
                </span>
              </div>
            </Col>
            <Col md={3}>
              <div className='d-flex align-items-center mb-2'>
                <FaInfoCircle className='me-2 text-primary' />
                <span>
                  <strong>From:</strong>{' '}
                  {assignment.referenceType === 'REGISTRATION'
                    ? 'Registration'
                    : assignment.referenceType === 'FIRST_QUIZ'
                    ? 'First Quiz'
                    : 'Last Quiz'}
                </span>
              </div>
            </Col>
            <Col md={3}>
              <div className='d-flex align-items-center mb-2'>
                <FaQuestionCircle className='me-2 text-info' />
                <span>
                  <strong>Questions:</strong> {quiz.questions?.length || 0}
                </span>
              </div>
            </Col>
            <Col md={3}>
              <div className='d-flex align-items-center mb-2'>
                {assignment.willRespectTimeFrame ? (
                  <FaCheckCircle className='me-2 text-success' />
                ) : (
                  <FaTimesCircle className='me-2 text-danger' />
                )}
                <span>
                  <strong>Time Frame:</strong>{' '}
                  {assignment.willRespectTimeFrame ? 'Respected' : 'Ignored'}
                </span>
              </div>
            </Col>
          </Row>

          <Row className='mt-2'>
            <Col md={6}>
              <small className='text-muted'>
                <strong>Reference Date:</strong> {format(referenceDate, 'PPp')}
              </small>
            </Col>
            <Col md={6}>
              <small className='text-muted'>
                <strong>Time Frame Handling:</strong>{' '}
                {quiz.timeFrameHandling === 'RESPECT_TIMEFRAME'
                  ? 'Respect user time frames'
                  : quiz.timeFrameHandling === 'ALL_USERS'
                  ? 'All users regardless of time frame'
                  : quiz.timeFrameHandling === 'OUTSIDE_TIMEFRAME_ONLY'
                  ? 'Only outside time frames'
                  : 'Legacy mode'}
              </small>
            </Col>
          </Row>

          {quiz.homePageMessage && (
            <Alert variant='info' className='mt-3 mb-0'>
              <small>
                <strong>User Message:</strong> {quiz.homePageMessage}
              </small>
            </Alert>
          )}
        </Card.Body>
      </Card>
    );
  };

  const renderQuizResult = (result) => {
    const quiz = quizzes?.find((q) => q._id === result.quizId) || {};

    return (
      <Card key={result._id} className='mb-3'>
        <Card.Header className='d-flex justify-content-between align-items-center'>
          <div>
            <h6 className='mb-1'>
              {result.quizName || quiz.name || 'Unknown Quiz'}
            </h6>
            <small className='text-muted'>
              Completed: {format(new Date(result.submittedAt), 'PPpp')}
            </small>
          </div>
          <Button
            variant='outline-primary'
            size='sm'
            onClick={() => {
              setSelectedResult(result);
              setShowResultModal(true);
            }}
          >
            <FaEye /> View Details
          </Button>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <div className='d-flex align-items-center mb-2'>
                <FaQuestionCircle className='me-2 text-info' />
                <span>
                  <strong>Answers:</strong> {result.answers?.length || 0}
                </span>
              </div>
            </Col>
            <Col md={6}>
              <div className='d-flex align-items-center mb-2'>
                <FaLayerGroup className='me-2 text-success' />
                <span>
                  <strong>Collections Assigned:</strong>{' '}
                  {result.assignedCollections?.length || 0}
                </span>
              </div>
            </Col>
          </Row>

          {result.assignedCollections &&
            result.assignedCollections.length > 0 && (
              <div className='mt-2'>
                <small className='text-muted'>Assigned Collections:</small>
                <div className='mt-1'>
                  {result.assignedCollections.map((collection, idx) => (
                    <Badge key={idx} bg='success' className='me-1 mb-1'>
                      {collection.collectionName || collection.collectionId}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
        </Card.Body>
      </Card>
    );
  };

  const renderPendingQuiz = (pendingQuiz, index) => {
    const quiz = pendingQuiz.quizId;
    if (!quiz) return null;

    // Calculate availability status
    const getAvailabilityStatus = () => {
      if (!quiz.isActive) {
        return {
          status: 'inactive',
          icon: FaBan,
          color: 'secondary',
          text: 'Quiz Inactive',
          description: 'This quiz is not active and cannot be accessed',
        };
      }

      // Check time frame restrictions
      const timeFrameHandling = quiz.timeFrameHandling || 'RESPECT_TIMEFRAME';
      const userInTimeFrame = user.timeFrame?.isWithinTimeFrame;

      switch (timeFrameHandling) {
        case 'RESPECT_TIMEFRAME':
          if (!userInTimeFrame) {
            return {
              status: 'blocked-timeframe',
              icon: FaExclamationTriangle,
              color: 'warning',
              text: 'Blocked by Time Frame',
              description: 'User is outside their allowed time frame',
            };
          }
          break;
        case 'OUTSIDE_TIMEFRAME_ONLY':
          if (userInTimeFrame) {
            return {
              status: 'blocked-timeframe',
              icon: FaExclamationTriangle,
              color: 'warning',
              text: 'Blocked by Time Frame',
              description:
                'Quiz only for users outside time frame, but user is within time frame',
            };
          }
          break;
        case 'ALL_USERS':
          // No time frame restrictions
          break;
        default:
          // Legacy handling
          if (quiz.respectUserTimeFrame && !userInTimeFrame) {
            return {
              status: 'blocked-timeframe',
              icon: FaExclamationTriangle,
              color: 'warning',
              text: 'Blocked by Time Frame',
              description:
                'User is outside their allowed time frame (legacy setting)',
            };
          }
          break;
      }

      // Check time interval triggers
      if (quiz.triggerType === 'TIME_INTERVAL') {
        // For simplicity, we'll assume trigger time has passed if it's assigned
        // In a real implementation, you'd calculate the actual trigger time here
        return {
          status: 'available',
          icon: FaCheckCircle,
          color: 'success',
          text: 'Available',
          description: 'Quiz is accessible to the user',
        };
      }

      return {
        status: 'available',
        icon: FaCheckCircle,
        color: 'success',
        text: 'Available',
        description: 'Quiz is accessible to the user',
      };
    };

    const availability = getAvailabilityStatus();
    const StatusIcon = availability.icon;

    // Use quiz._id for the key instead of index for better React rendering
    const uniqueKey = `pending-${quiz._id}-${pendingQuiz.assignedAt}`;

    return (
      <Card key={uniqueKey} className='mb-3'>
        <Card.Header className='d-flex justify-content-between align-items-center'>
          <div>
            <h6 className='mb-1 d-flex align-items-center'>
              <FaClock className='me-2 text-warning' />
              {quiz.name}
              <Badge
                bg={availability.color}
                className='ms-2'
                title={availability.description}
              >
                <StatusIcon className='me-1' size={12} />
                {availability.text}
              </Badge>
            </h6>
            <small className='text-muted'>
              Assigned: {format(new Date(pendingQuiz.assignedAt), 'PPpp')}
            </small>
            {availability.status !== 'available' && (
              <div className='mt-1'>
                <small className={`text-${availability.color}`}>
                  <StatusIcon className='me-1' size={12} />
                  {availability.description}
                </small>
              </div>
            )}
          </div>
          <Button
            variant='outline-danger'
            size='sm'
            onClick={() => onUnassignSpecificQuiz(quiz._id)}
            disabled={isLoading}
            title='Remove this quiz assignment'
          >
            <FaTrash />
          </Button>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <div className='d-flex align-items-center mb-2'>
                <FaQuestionCircle className='me-2 text-info' />
                <span>
                  <strong>Questions:</strong> {quiz.questions?.length || 0}
                </span>
              </div>
            </Col>
            <Col md={4}>
              <div className='d-flex align-items-center mb-2'>
                <FaInfoCircle className='me-2 text-primary' />
                <span>
                  <strong>Type:</strong>{' '}
                  {quiz.triggerType === 'TIME_INTERVAL' ? 'Auto' : 'Manual'}
                </span>
              </div>
            </Col>
            <Col md={4}>
              <div className='d-flex align-items-center mb-2'>
                <FaInfoCircle className='me-2 text-secondary' />
                <span>
                  <strong>Time Frame:</strong>{' '}
                  {quiz.timeFrameHandling || 'RESPECT_TIMEFRAME'}
                </span>
              </div>
            </Col>
          </Row>

          {/* User's current time frame status */}
          <Row className='mt-2'>
            <Col md={12}>
              <div className='d-flex align-items-center mb-2'>
                {user.timeFrame?.isWithinTimeFrame ? (
                  <FaCheckCircle className='me-2 text-success' />
                ) : (
                  <FaTimesCircle className='me-2 text-danger' />
                )}
                <span>
                  <strong>User Status:</strong>{' '}
                  {user.timeFrame?.isWithinTimeFrame
                    ? 'Within Time Frame'
                    : 'Outside Time Frame'}
                </span>
              </div>
            </Col>
          </Row>

          {quiz.questions && quiz.questions.length > 0 && (
            <div className='mt-3'>
              <small className='text-muted'>Question Types:</small>
              <div className='mt-1'>{formatQuestionTypes(quiz.questions)}</div>
            </div>
          )}

          {quiz.homePageMessage && (
            <Alert variant='info' className='mt-3 mb-0'>
              <small>
                <strong>User Message:</strong> {quiz.homePageMessage}
              </small>
            </Alert>
          )}
        </Card.Body>
      </Card>
    );
  };

  return (
    <>
      <Card className='quiz-management-card'>
        <Card.Header className='d-flex justify-content-between align-items-center'>
          <div className='d-flex align-items-center'>
            <FaQuestionCircle className='me-3 text-primary' size={20} />
            <div>
              <h5 className='mb-0'>Quiz Management</h5>
              <small className='text-muted'>
                Assign and manage quizzes for this user
              </small>
            </div>
          </div>
          <div className='d-flex gap-2'>
            <Button
              variant='success'
              size='sm'
              onClick={downloadQuizReport}
              disabled={!userQuizResults || userQuizResults.length === 0}
              title='Download all quiz results as text file'
            >
              <FaDownload className='me-2' />
              Download Report
            </Button>
            <Button
              variant='primary'
              size='sm'
              onClick={() => setShowAssignModal(true)}
              disabled={isLoading}
            >
              <FaPlus className='me-2' />
              Assign Quiz
            </Button>
          </div>
        </Card.Header>

        <Card.Body>
          <Accordion>
            {/* Pending Quizzes */}
            <Accordion.Item eventKey='0'>
              <Accordion.Header>
                <div className='d-flex align-items-center'>
                  <FaClock className='me-2 text-warning' />
                  <span>
                    Pending Quizzes ({user?.pendingQuizzes?.length || 0})
                  </span>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                {/* Summary of quiz availability */}
                {user?.pendingQuizzes && user.pendingQuizzes.length > 0 && (
                  <Alert variant='info' className='mb-3'>
                    <div className='d-flex align-items-center mb-2'>
                      <FaInfoCircle className='me-2' />
                      <strong>Quiz Availability Summary</strong>
                    </div>
                    <div className='small'>
                      <div className='mb-1'>
                        <strong>User Time Frame Status:</strong>{' '}
                        {user.timeFrame?.isWithinTimeFrame ? (
                          <Badge bg='success'>Within Time Frame</Badge>
                        ) : (
                          <Badge bg='danger'>Outside Time Frame</Badge>
                        )}
                      </div>
                      <div>
                        <strong>What user sees at /quiz:</strong>{' '}
                        {(() => {
                          const availableCount = user.pendingQuizzes.filter(
                            (pendingQuiz) => {
                              const quiz = pendingQuiz.quizId;
                              if (!quiz || !quiz.isActive) return false;

                              const timeFrameHandling =
                                quiz.timeFrameHandling || 'RESPECT_TIMEFRAME';
                              switch (timeFrameHandling) {
                                case 'RESPECT_TIMEFRAME':
                                  return user.timeFrame?.isWithinTimeFrame;
                                case 'OUTSIDE_TIMEFRAME_ONLY':
                                  return !user.timeFrame?.isWithinTimeFrame;
                                case 'ALL_USERS':
                                  return true;
                                default:
                                  return quiz.respectUserTimeFrame
                                    ? user.timeFrame?.isWithinTimeFrame
                                    : true;
                              }
                            }
                          ).length;

                          return availableCount > 0 ? (
                            <Badge bg='success'>
                              {availableCount} quiz(s) available
                            </Badge>
                          ) : (
                            <Badge bg='warning'>No quizzes available</Badge>
                          );
                        })()}
                      </div>
                    </div>
                  </Alert>
                )}

                {user?.pendingQuizzes && user.pendingQuizzes.length > 0 ? (
                  <>{user.pendingQuizzes.map(renderPendingQuiz)}</>
                ) : (
                  <div className='text-center py-4'>
                    <FaExclamationTriangle
                      className='text-muted mb-3'
                      size={30}
                    />
                    <p className='text-muted mb-0'>
                      No pending quizzes assigned
                    </p>
                  </div>
                )}
              </Accordion.Body>
            </Accordion.Item>

            {/* Future Quiz Assignments */}
            <Accordion.Item eventKey='1'>
              <Accordion.Header>
                <div className='d-flex align-items-center'>
                  <FaCalendarAlt className='me-2 text-info' />
                  <span>
                    Future Quiz Assignments ({futureAssignments?.length || 0})
                  </span>
                  {isLoadingFuture && (
                    <Spinner animation='border' size='sm' className='ms-2' />
                  )}
                </div>
              </Accordion.Header>
              <Accordion.Body>
                {futureError && (
                  <Alert variant='danger' className='mb-3'>
                    <FaExclamationTriangle className='me-2' />
                    Error loading future assignments:{' '}
                    {futureError.message || 'Unknown error'}
                  </Alert>
                )}

                {futureAssignments && futureAssignments.length > 0 ? (
                  <>
                    <Alert variant='info' className='mb-3'>
                      <FaInfoCircle className='me-2' />
                      These are TIME_INTERVAL triggered quizzes that will be
                      automatically assigned to this user in the future. You can
                      remove any of these to prevent automatic assignment.
                    </Alert>
                    {futureAssignments.map(renderFutureAssignment)}
                  </>
                ) : !isLoadingFuture ? (
                  <div className='text-center py-4'>
                    <FaCalendarAlt className='text-muted mb-3' size={30} />
                    <p className='text-muted mb-0'>
                      No future quiz assignments scheduled
                    </p>
                    <small className='text-muted'>
                      Future assignments are created for TIME_INTERVAL triggered
                      quizzes based on user activity.
                    </small>
                  </div>
                ) : null}
              </Accordion.Body>
            </Accordion.Item>

            {/* Completed Quizzes */}
            <Accordion.Item eventKey='2'>
              <Accordion.Header>
                <div className='d-flex align-items-center'>
                  <FaCheckCircle className='me-2 text-success' />
                  <span>
                    Completed Quizzes ({userQuizResults?.length || 0})
                  </span>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                {userQuizResults && userQuizResults.length > 0 ? (
                  userQuizResults.map(renderQuizResult)
                ) : (
                  <div className='text-center py-4'>
                    <FaInfoCircle className='text-muted mb-3' size={30} />
                    <p className='text-muted mb-0'>
                      No completed quizzes found
                    </p>
                  </div>
                )}
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Card.Body>
      </Card>

      {/* Assign Quiz Modal */}
      <Modal
        show={showAssignModal}
        onHide={() => {
          setShowAssignModal(false);
          setSelectedQuizId('');
        }}
        size='lg'
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Assign Quiz to User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className='mb-3'>
            <Form.Label>Select Quiz</Form.Label>
            <Form.Select
              value={selectedQuizId}
              onChange={(e) => setSelectedQuizId(e.target.value)}
              disabled={!quizzes}
            >
              <option value=''>-- Select a Quiz --</option>
              {quizzes?.map((quiz) => (
                <option key={quiz._id} value={quiz._id}>
                  {quiz.name}
                  {quiz.triggerType === 'TIME_INTERVAL' &&
                    ` (Auto: ${quiz.triggerDelayDays} days)`}
                  {!quiz.isActive && ' (Inactive)'}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {selectedQuizId && (
            <Card className='quiz-preview'>
              <Card.Header>
                <h6 className='mb-0'>Quiz Preview</h6>
              </Card.Header>
              <Card.Body>
                {(() => {
                  const selectedQuiz = quizzes?.find(
                    (q) => q._id === selectedQuizId
                  );
                  if (!selectedQuiz) return null;
                  return (
                    <Row>
                      <Col md={6}>
                        <ListGroup variant='flush'>
                          <ListGroup.Item className='px-0'>
                            <strong>Type:</strong>{' '}
                            {selectedQuiz.triggerType === 'TIME_INTERVAL'
                              ? 'Time-based'
                              : 'Manual Assignment'}
                          </ListGroup.Item>
                          {selectedQuiz.triggerType === 'TIME_INTERVAL' && (
                            <ListGroup.Item className='px-0'>
                              <strong>Delay:</strong>{' '}
                              {selectedQuiz.triggerDelayDays} days after
                              registration
                            </ListGroup.Item>
                          )}
                          <ListGroup.Item className='px-0'>
                            <strong>Respects Time Frame:</strong>{' '}
                            {selectedQuiz.respectUserTimeFrame ? 'Yes' : 'No'}
                          </ListGroup.Item>
                          <ListGroup.Item className='px-0'>
                            <strong>Status:</strong>
                            <Badge
                              bg={selectedQuiz.isActive ? 'success' : 'warning'}
                              className='ms-2'
                            >
                              {selectedQuiz.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </ListGroup.Item>
                        </ListGroup>
                      </Col>
                      <Col md={6}>
                        <ListGroup variant='flush'>
                          <ListGroup.Item className='px-0'>
                            <strong>Questions:</strong>{' '}
                            {selectedQuiz.questions?.length || 0}
                          </ListGroup.Item>
                          {selectedQuiz.questions &&
                            selectedQuiz.questions.length > 0 && (
                              <ListGroup.Item className='px-0'>
                                <strong>Question Types:</strong>
                                <div className='mt-1'>
                                  {selectedQuiz.questions.map((q, idx) => (
                                    <Badge
                                      key={idx}
                                      bg='info'
                                      className='me-1 mb-1'
                                    >
                                      {getQuestionTypeIcon(q.type)}{' '}
                                      {q.type.replace('-', ' ')}
                                    </Badge>
                                  ))}
                                </div>
                              </ListGroup.Item>
                            )}
                          <ListGroup.Item className='px-0'>
                            <strong>Assignment Rules:</strong>{' '}
                            {selectedQuiz.assignmentRules?.length || 0}
                          </ListGroup.Item>
                        </ListGroup>
                      </Col>
                      {selectedQuiz.homePageMessage && (
                        <Col xs={12} className='mt-3'>
                          <Alert variant='info' className='mb-0'>
                            <strong>User Message:</strong> "
                            {selectedQuiz.homePageMessage}"
                          </Alert>
                        </Col>
                      )}
                    </Row>
                  );
                })()}
              </Card.Body>
            </Card>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant='secondary'
            onClick={() => {
              setShowAssignModal(false);
              setSelectedQuizId('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant='primary'
            onClick={handleAssignQuiz}
            disabled={!selectedQuizId || isLoading}
          >
            {isLoading ? 'Assigning...' : 'Assign Quiz'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Quiz Result Details Modal */}
      <Modal
        show={showResultModal}
        onHide={() => {
          setShowResultModal(false);
          setSelectedResult(null);
        }}
        size='xl'
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Quiz Result Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedResult && (
            <div>
              <Row className='mb-4'>
                <Col md={6}>
                  <h6>Quiz Information</h6>
                  <ListGroup variant='flush'>
                    <ListGroup.Item className='px-0'>
                      <strong>Quiz Name:</strong> {selectedResult.quizName}
                    </ListGroup.Item>
                    <ListGroup.Item className='px-0'>
                      <strong>Completed:</strong>{' '}
                      {format(new Date(selectedResult.submittedAt), 'PPPpp')}
                    </ListGroup.Item>
                    <ListGroup.Item className='px-0'>
                      <strong>Total Answers:</strong>{' '}
                      {selectedResult.answers?.length || 0}
                    </ListGroup.Item>
                  </ListGroup>
                </Col>
                <Col md={6}>
                  <h6>Collections Assigned</h6>
                  {selectedResult.assignedCollections &&
                  selectedResult.assignedCollections.length > 0 ? (
                    <ListGroup variant='flush'>
                      {selectedResult.assignedCollections.map(
                        (collection, idx) => (
                          <ListGroup.Item key={idx} className='px-0'>
                            <Badge bg='success' className='me-2'>
                              {idx + 1}
                            </Badge>
                            {collection.collectionName ||
                              collection.collectionId}
                            {collection.assignedAt && (
                              <small className='text-muted d-block'>
                                Assigned:{' '}
                                {format(new Date(collection.assignedAt), 'PPp')}
                              </small>
                            )}
                          </ListGroup.Item>
                        )
                      )}
                    </ListGroup>
                  ) : (
                    <p className='text-muted'>No collections assigned</p>
                  )}
                </Col>
              </Row>

              <h6>Question Answers</h6>
              {selectedResult.answers && selectedResult.answers.length > 0 ? (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Question</th>
                      <th>Answer</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedResult.answers.map((answer, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>
                          {answer.question || answer.questionText || 'N/A'}
                        </td>
                        <td>
                          <Badge bg='primary'>
                            {answer.answer || answer.answerText || 'N/A'}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg='info'>
                            {getQuestionTypeIcon(
                              answer.questionType || 'unknown'
                            )}{' '}
                            {answer.questionType || 'Unknown'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className='text-muted'>No answers recorded</p>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant='secondary'
            onClick={() => {
              setShowResultModal(false);
              setSelectedResult(null);
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UserQuizManagement;
