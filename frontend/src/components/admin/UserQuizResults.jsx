import { useState } from 'react';
import { Table, Button, Modal, Card, Badge } from 'react-bootstrap';
import { FaEye } from 'react-icons/fa';
import { useGetUserQuizResultsQuery } from '../../slices/quizApiSlice';
import Loader from '../Loader';
import Message from '../Message';
import QuizReport from './QuizReport';
import { format } from 'date-fns';

const UserQuizResults = ({ userId }) => {
  const { data: quizResults, isLoading, error } = useGetUserQuizResultsQuery(userId);

  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  const handleShowReport = (result) => {
    setSelectedResult(result);
    setShowReportModal(true);
  };

  if (isLoading) return <Loader />;
  if (error) return <Message variant='danger'>{error?.data?.message || error.error}</Message>;

  return (
    <>
      <Card>
        <Card.Header>Quiz History</Card.Header>
        <Card.Body>
          {quizResults && quizResults.length > 0 ? (
            <Table striped bordered hover responsive className='table-sm'>
              <thead>
                <tr>
                  <th>QUIZ NAME</th>
                  <th>DATE TAKEN</th>
                  <th>COLLECTIONS ASSIGNED</th>
                  <th>ASSIGNMENT TYPE</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {quizResults.map((result) => (
                  <tr key={result._id}>
                    <td>{result.quizId?.name || result.quizName || 'Quiz not found'}</td>
                    <td>{format(new Date(result.submittedAt), 'yyyy-MM-dd HH:mm')}</td>
                    <td>
                      <Badge bg='info'>
                        {result.assignedCollections?.length || 0}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={result.assignmentType === 'TIME_INTERVAL' ? 'primary' : 'secondary'}>
                        {result.assignmentType === 'TIME_INTERVAL' ? 'Auto' : 'Manual'}
                      </Badge>
                    </td>
                    <td>
                      <Button variant='light' className='btn-sm' onClick={() => handleShowReport(result)}>
                        <FaEye /> View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Message>No quiz results found for this user.</Message>
          )}
        </Card.Body>
      </Card>

      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} size='lg'>
        <Modal.Header closeButton>
          <Modal.Title>Quiz Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedResult && <QuizReport quizResult={selectedResult} />}
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={() => setShowReportModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UserQuizResults;
