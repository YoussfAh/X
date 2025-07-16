import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import { Table, Button, Row, Col, Modal, Form } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import {
  useGetQuizzesQuery,
  useCreateQuizMutation,
  useDeleteQuizMutation,
} from '../../slices/quizApiSlice';

const AdminQuizListScreen = () => {
  const navigate = useNavigate();
  const { data: quizzes, isLoading, error, refetch } = useGetQuizzesQuery();
  const [createQuiz, { isLoading: isCreating }] = useCreateQuizMutation();
  const [deleteQuiz, { isLoading: isDeleting }] = useDeleteQuizMutation();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQuizName, setNewQuizName] = useState('');

  const handleShowCreateModal = () => setShowCreateModal(true);
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setNewQuizName('');
  };

  const handleCreateQuiz = async () => {
    if (!newQuizName.trim()) {
      toast.error('Quiz name cannot be empty');
      return;
    }
    try {
      const newQuiz = await createQuiz({ name: newQuizName }).unwrap();
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

  return (
    <>
      <Row className='align-items-center'>
        <Col>
          <h1>Quizzes</h1>
        </Col>
        <Col className='text-end'>
          <Button className='my-3' onClick={handleShowCreateModal}>
            <FaPlus /> Create Quiz
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
        <Table striped bordered hover responsive className='table-sm'>
          <thead>
            <tr>
              <th>NAME</th>
              <th>ACTIVE</th>
              <th>TRIGGER TYPE</th>
              <th>DETAILS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((quiz) => (
              <tr key={quiz._id}>
                <td>{quiz.name}</td>
                <td>{quiz.isActive ? 'Yes' : 'No'}</td>
                <td>{quiz.triggerType.replace('_', ' ')}</td>
                <td>
                  {quiz.triggerType === 'TIME_INTERVAL'
                    ? `${quiz.triggerDelayDays} day(s) delay`
                    : 'Admin Assigned'}
                </td>
                <td>
                  <LinkContainer to={`/admin/quiz/${quiz._id}/edit`}>
                    <Button variant='light' className='btn-sm mx-2'>
                      <FaEdit />
                    </Button>
                  </LinkContainer>
                  <Button
                    variant='danger'
                    className='btn-sm'
                    onClick={() => deleteHandler(quiz._id)}
                  >
                    <FaTrash style={{ color: 'white' }} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={showCreateModal} onHide={handleCloseCreateModal}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Quiz</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId='newQuizName'>
            <Form.Label>Quiz Name</Form.Label>
            <Form.Control
              type='text'
              placeholder='Enter quiz name'
              value={newQuizName}
              onChange={(e) => setNewQuizName(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={handleCloseCreateModal}>
            Cancel
          </Button>
          <Button variant='primary' onClick={handleCreateQuiz} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminQuizListScreen;

