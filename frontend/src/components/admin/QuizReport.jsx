import React from 'react';
import { ListGroup, Card } from 'react-bootstrap';
import { format } from 'date-fns';

const QuizReport = ({ quizResult }) => {
  if (!quizResult) {
    return null;
  }

  // We now expect quizId to be populated with the quiz name
  const { quizId, submittedAt, answers, assignedCollections } = quizResult;

  return (
    <Card border='light'>
      <Card.Header className='bg-light text-dark d-flex justify-content-between align-items-center'>
        <span>
          Report for: <strong>{quizId?.name || 'N/A'}</strong>
        </span>
        <small className='text-muted'>
          Taken on: {submittedAt ? format(new Date(submittedAt), 'yyyy-MM-dd HH:mm') : 'N/A'}
        </small>
      </Card.Header>
      <Card.Body>
        <h6 className='card-subtitle mb-3 text-muted'>Questions & Answers</h6>
        <ListGroup variant='flush' className='mb-4'>
          {answers?.map((answer, index) => (
            <ListGroup.Item key={index} className='px-0'>
              <p className='mb-1'>
                <strong>Q: {answer.questionText || 'Question text not recorded.'}</strong>
              </p>
              <p className='text-muted mb-0'>A: {answer.answerText || 'No answer provided.'}</p>
            </ListGroup.Item>
          ))}
        </ListGroup>

        <h6 className='card-subtitle mb-3 text-muted'>Collections Assigned</h6>
        {assignedCollections?.length > 0 ? (
          <ListGroup variant='flush'>
            {assignedCollections.map((assigned, index) => (
              <ListGroup.Item key={index} className='px-0'>
                {assigned.collectionId?.name || 'Collection name not available'}
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <p className='text-muted'>No collections were assigned from this quiz.</p>
        )}
      </Card.Body>
    </Card>
  );
};

export default QuizReport;