import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import { Table, Button, Row, Col, Modal, Form, Card, Badge, Alert } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaCog, FaQuestionCircle, FaClock, FaUsers } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import {
  useGetQuizzesQuery,
  useCreateQuizMutation,
  useDeleteQuizMutation,
  useUpdateQuizMutation,
} from '../../slices/quizApiSlice';

const AdminQuizSettingsScreen = () => {
  const navigate = useNavigate();
  const { data: quizzes, isLoading, error, refetch } = useGetQuizzesQuery();
  const [createQuiz, { isLoading: isCreating }] = useCreateQuizMutation();
  const [deleteQuiz, { isLoading: isDeleting }] = useDeleteQuizMutation();
  const [updateQuiz] = useUpdateQuizMutation();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQuizName, setNewQuizName] = useState('');
  const [newQuizTriggerType, setNewQuizTriggerType] = useState('ADMIN_ASSIGNMENT');
  const [newQuizTriggerDelayDays, setNewQuizTriggerDelayDays] = useState(0);
  const [newQuizRespectTimeFrame, setNewQuizRespectTimeFrame] = useState(true);
  const [newQuizHomePageMessage, setNewQuizHomePageMessage] = useState('You have a new quiz available! Take it now to get your personalized plan.');

  const handleShowCreateModal = () => setShowCreateModal(true);
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setNewQuizName('');
    setNewQuizTriggerType('ADMIN_ASSIGNMENT');
    setNewQuizTriggerDelayDays(0);
    setNewQuizRespectTimeFrame(true);
    setNewQuizHomePageMessage('You have a new quiz available! Take it now to get your personalized plan.');
  };

  const handleCreateQuiz = async () => {
    if (!newQuizName.trim()) {
      toast.error('Quiz name cannot be empty');
      return;
    }
    try {
      const newQuizData = {
        name: newQuizName,
        triggerType: newQuizTriggerType,
        triggerDelayDays: newQuizTriggerDelayDays,
        respectUserTimeFrame: newQuizRespectTimeFrame,
        homePageMessage: newQuizHomePageMessage,
        isActive: false, // Start as inactive until configured
      };
      const newQuiz = await createQuiz(newQuizData).unwrap();
      handleCloseCreateModal();
      toast.success('New quiz created successfully');
      navigate(`/admin/quiz/${newQuiz._id}/edit`);
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      try {
        await deleteQuiz(id).unwrap();
        refetch();
        toast.success('Quiz deleted');
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  const toggleQuizActive = async (quiz) => {
    try {
      await updateQuiz({
        ...quiz,
        isActive: !quiz.isActive,
      }).unwrap();
      refetch();
      toast.success(`Quiz ${quiz.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const getTriggerDescription = (quiz) => {
    if (quiz.triggerType === 'TIME_INTERVAL') {
      if (quiz.triggerDelayDays === 0) {
        return 'Immediately after registration';
      } else if (quiz.triggerDelayDays === 1) {
        return '1 day after registration';
      } else if (quiz.triggerDelayDays === 7) {
        return '1 week after registration';
      } else if (quiz.triggerDelayDays === 30) {
        return '1 month after registration';
      } else {
        return `${quiz.triggerDelayDays} days after registration`;
      }
    }
    return 'Admin Assignment';
  };

  return (
    <>
      <Row className='align-items-center mb-4'>
        <Col>
          <h1><FaCog className='me-2' />Quiz Settings & Management</h1>
          <p className='text-muted'>Create and manage multiple quizzes with different timing and assignment rules.</p>
        </Col>
        <Col className='text-end'>
          <Button className='my-3' onClick={handleShowCreateModal} variant='primary'>
            <FaPlus /> Create New Quiz
          </Button>
        </Col>
      </Row>

      {isCreating && <Loader />}
      {isDeleting && <Loader />}

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error.data?.message || error.error}</Message>
      ) : (
        <>
          {quizzes && quizzes.length === 0 ? (
            <Alert variant='info'>
              <FaQuestionCircle className='me-2' />
              No quizzes created yet. Create your first quiz to get started!
            </Alert>
          ) : (
            <Card>
              <Card.Header>
                <h5 className='mb-0'>All Quizzes ({quizzes?.length || 0})</h5>
              </Card.Header>
              <Card.Body className='p-0'>
                <Table striped hover responsive className='mb-0'>
                  <thead className='table-dark'>
                    <tr>
                      <th>Quiz Name</th>
                      <th>Status</th>
                      <th>Trigger Type</th>
                      <th>Timing</th>
                      <th>Time Frame Respect</th>
                      <th>Questions</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizzes?.map((quiz) => (
                      <tr key={quiz._id}>
                        <td>
                          <strong>{quiz.name}</strong>
                          {quiz.homePageMessage && (
                            <div className='text-muted small mt-1'>
                              Message: "{quiz.homePageMessage}"
                            </div>
                          )}
                        </td>
                        <td>
                          <Badge 
                            bg={quiz.isActive ? 'success' : 'secondary'}
                            style={{ cursor: 'pointer' }}
                            onClick={() => toggleQuizActive(quiz)}
                            title='Click to toggle'
                          >
                            {quiz.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={quiz.triggerType === 'TIME_INTERVAL' ? 'primary' : 'info'}>
                            <FaClock className='me-1' />
                            {quiz.triggerType === 'TIME_INTERVAL' ? 'Time-Based' : 'Admin Assignment'}
                          </Badge>
                        </td>
                        <td>{getTriggerDescription(quiz)}</td>
                        <td>
                          <Badge bg={quiz.respectUserTimeFrame ? 'warning' : 'secondary'}>
                            {quiz.respectUserTimeFrame ? 'Yes' : 'No'}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg='light' text='dark'>
                            {quiz.questions?.length || 0} questions
                          </Badge>
                        </td>
                        <td>
                          <div className='d-flex gap-2'>
                            <LinkContainer to={`/admin/quiz/${quiz._id}/edit`}>
                              <Button variant='outline-primary' size='sm' title='Edit Quiz'>
                                <FaEdit />
                              </Button>
                            </LinkContainer>
                            <Button
                              variant='outline-danger'
                              size='sm'
                              onClick={() => deleteHandler(quiz._id)}
                              title='Delete Quiz'
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </>
      )}

      {/* Create Quiz Modal */}
      <Modal show={showCreateModal} onHide={handleCloseCreateModal} size='lg'>
        <Modal.Header closeButton>
          <Modal.Title>Create New Quiz</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group controlId='newQuizName' className='mb-3'>
                  <Form.Label>Quiz Name *</Form.Label>
                  <Form.Control
                    type='text'
                    placeholder='Enter quiz name'
                    value={newQuizName}
                    onChange={(e) => setNewQuizName(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId='newQuizTriggerType' className='mb-3'>
                  <Form.Label>Trigger Type</Form.Label>
                  <Form.Select
                    value={newQuizTriggerType}
                    onChange={(e) => setNewQuizTriggerType(e.target.value)}
                  >
                    <option value='ADMIN_ASSIGNMENT'>Admin Assignment</option>
                    <option value='TIME_INTERVAL'>Time-Based (Automatic)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {newQuizTriggerType === 'TIME_INTERVAL' && (
              <Row>
                <Col md={6}>
                  <Form.Group controlId='newQuizTriggerDelayDays' className='mb-3'>
                    <Form.Label>Show After (Days)</Form.Label>
                    <Form.Select
                      value={newQuizTriggerDelayDays}
                      onChange={(e) => setNewQuizTriggerDelayDays(Number(e.target.value))}
                    >
                      <option value={0}>Immediately (0 days)</option>
                      <option value={1}>1 Day</option>
                      <option value={7}>1 Week (7 days)</option>
                      <option value={14}>2 Weeks (14 days)</option>
                      <option value={30}>1 Month (30 days)</option>
                      <option value={60}>2 Months (60 days)</option>
                      <option value={90}>3 Months (90 days)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId='newQuizRespectTimeFrame' className='mb-3'>
                    <Form.Label>Respect User Time Frame</Form.Label>
                    <Form.Select
                      value={newQuizRespectTimeFrame}
                      onChange={(e) => setNewQuizRespectTimeFrame(e.target.value === 'true')}
                    >
                      <option value={true}>Yes - Only show to users within time frame</option>
                      <option value={false}>No - Show to all users regardless of time frame</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Form.Group controlId='newQuizHomePageMessage' className='mb-3'>
              <Form.Label>Home Page Message</Form.Label>
              <Form.Control
                as='textarea'
                rows={2}
                placeholder='Message to show on home page when this quiz is available'
                value={newQuizHomePageMessage}
                onChange={(e) => setNewQuizHomePageMessage(e.target.value)}
              />
              <Form.Text className='text-muted'>
                This message will appear on the user's home page when this quiz is available for them.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={handleCloseCreateModal}>
            Cancel
          </Button>
          <Button variant='primary' onClick={handleCreateQuiz} disabled={!newQuizName.trim()}>
            Create Quiz
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminQuizSettingsScreen;
