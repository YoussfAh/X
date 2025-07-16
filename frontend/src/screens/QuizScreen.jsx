import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetActiveQuizForUserQuery,
  useSubmitQuizAnswersMutation,
} from '../slices/quizApiSlice';
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  Card,
  ProgressBar,
} from 'react-bootstrap';
import Loader from '../components/Loader';
import Message from '../components/Message';
import QuizCompletionModal from '../components/QuizCompletionModal';
import { toast } from 'react-toastify';
import './QuizScreen.css';

const QuizScreen = () => {
  const { data: quiz, isLoading, error } = useGetActiveQuizForUserQuery();
  const [submitQuizAnswers, { isLoading: isSubmitting }] =
    useSubmitQuizAnswersMutation();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState({}); // Stores { [questionId]: optionId }
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [cachedQuiz, setCachedQuiz] = useState(null); // Cache quiz data to prevent loss after submission

  // Cache the quiz data when it's first loaded
  React.useEffect(() => {
    if (quiz && quiz.questions && quiz.questions.length > 0) {
      setCachedQuiz(quiz);
    }
  }, [quiz]);

  if (isLoading) return <Loader />;

  // Don't show "No active quiz" if quiz was just completed or modal is showing
  if (
    (error || !quiz || !quiz.questions || quiz.questions.length === 0) &&
    !quizCompleted &&
    !showCompletionModal &&
    !cachedQuiz
  ) {
    setTimeout(() => navigate('/'), 3000); // Redirect to home page
    return (
      <div className='quiz-container'>
        <Container className='quiz-content text-center'>
          <Card className='quiz-card'>
            <Card.Body>
              <h4>
                {error ? 'Could not load quiz.' : 'No active quiz available.'}
              </h4>
              <p>Redirecting to your home page...</p>
              {error && (
                <Message variant='danger'>
                  {error.data?.message || error.error}
                </Message>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  // Use cached quiz if available and quiz was completed
  const activeQuiz = quizCompleted && cachedQuiz ? cachedQuiz : quiz;

  // If no active quiz is available, show loading
  if (
    !activeQuiz ||
    !activeQuiz.questions ||
    activeQuiz.questions.length === 0
  ) {
    return <Loader />;
  }

  const { questions } = activeQuiz;
  const currentQuestion = questions[currentPage];

  const handleAnswerChange = (questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const nextPage = () => {
    if (
      currentQuestion.type !== 'informational' &&
      !answers[currentQuestion._id]
    ) {
      toast.error('Please provide an answer to continue.');
      return;
    }
    // For text questions, check if answer is not empty
    if (
      currentQuestion.type === 'text' &&
      (!answers[currentQuestion._id] ||
        answers[currentQuestion._id].trim() === '')
    ) {
      toast.error('Please enter a text answer to continue.');
      return;
    }
    if (currentPage < questions.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleFinalSubmit = async () => {
    if (
      currentQuestion.type !== 'informational' &&
      !answers[currentQuestion._id]
    ) {
      toast.error('Please provide an answer for the final question.');
      return;
    }
    // For text questions, check if answer is not empty
    if (
      currentQuestion.type === 'text' &&
      (!answers[currentQuestion._id] ||
        answers[currentQuestion._id].trim() === '')
    ) {
      toast.error('Please enter a text answer for the final question.');
      return;
    }

    const requiredQuestions = questions.filter(
      (q) => q.type !== 'informational'
    );
    const answeredQuestions = Object.keys(answers).filter((questionId) => {
      const question = questions.find((q) => q._id === questionId);
      if (question?.type === 'text') {
        return answers[questionId] && answers[questionId].trim() !== '';
      }
      return answers[questionId];
    });

    if (answeredQuestions.length < requiredQuestions.length) {
      toast.error('Please answer all questions before submitting.');
      return;
    }

    setIsSubmittingQuiz(true);

    try {
      const submissionData = Object.entries(answers).map(
        ([questionId, answer]) => {
          const question = questions.find((q) => q._id === questionId);
          if (question?.type === 'text') {
            // For text questions, we need to handle differently
            return { questionId, textAnswer: answer };
          }
          return { questionId, optionId: answer };
        }
      );

      const response = await submitQuizAnswers({
        quizId: activeQuiz._id,
        answers: submissionData,
      }).unwrap();

      // Mark quiz as completed immediately to prevent any race conditions
      setQuizCompleted(true);

      // Show completion modal with the message from the backend
      setCompletionMessage(
        response.completionMessage ||
          activeQuiz.completionMessage ||
          'Thank you for completing the quiz!'
      );

      // Stop the submitting state and show modal
      setIsSubmittingQuiz(false);
      setShowCompletionModal(true);
    } catch (err) {
      setIsSubmittingQuiz(false);
      setQuizCompleted(false); // Reset completion state on error
      toast.error(err.data?.message || err.error || 'Failed to submit quiz.');
    }
  };

  const handleContinueAfterCompletion = async () => {
    setShowCompletionModal(false);

    // Always navigate to home after completing a quiz
    setTimeout(() => {
      navigate('/');
      toast.success(
        '🎉 Quiz completed successfully! Welcome back to your dashboard.',
        {
          position: 'top-center',
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    }, 300);
  };

  const progress = ((currentPage + 1) / questions.length) * 100;

  return (
    <div className='quiz-container'>
      <div className='quiz-overlay'></div>
      <Container fluid className='quiz-content px-1'>
        <Row className='justify-content-center'>
          <Col md={8}>
            <Card className='quiz-card'>
              <Card.Body>
                <ProgressBar
                  now={progress}
                  label={`${Math.round(progress)}%`}
                  className='mb-4'
                />
                <h2 className='text-center mb-4'>
                  {currentQuestion.questionText}
                </h2>
                <Form>
                  {(currentQuestion.type === 'multiple-choice' ||
                    currentQuestion.type === 'true-false') &&
                    currentQuestion.options.map((option) => (
                      <Button
                        key={option._id}
                        variant={
                          answers[currentQuestion._id] === option._id
                            ? 'primary'
                            : 'outline-primary'
                        }
                        className='d-block w-100 my-2 quiz-option'
                        onClick={() =>
                          handleAnswerChange(currentQuestion._id, option._id)
                        }
                      >
                        {option.text}
                      </Button>
                    ))}
                  {currentQuestion.type === 'text' && (
                    <Form.Group className='mb-3'>
                      <Form.Control
                        as='textarea'
                        rows={4}
                        placeholder='Enter your answer here...'
                        value={answers[currentQuestion._id] || ''}
                        onChange={(e) =>
                          handleAnswerChange(
                            currentQuestion._id,
                            e.target.value
                          )
                        }
                        className='quiz-text-input'
                      />
                    </Form.Group>
                  )}
                  {currentQuestion.type === 'informational' && (
                    <div className='informational-text text-center' />
                  )}
                </Form>
                <div className='d-flex justify-content-between mt-4'>
                  <Button onClick={prevPage} disabled={currentPage === 0}>
                    &larr; Back
                  </Button>
                  {currentPage < questions.length - 1 ? (
                    <Button onClick={nextPage}>Next &rarr;</Button>
                  ) : (
                    <Button
                      onClick={handleFinalSubmit}
                      disabled={isSubmitting || isSubmittingQuiz}
                    >
                      {isSubmitting || isSubmittingQuiz ? (
                        <>
                          <span
                            className='spinner-border spinner-border-sm me-2'
                            role='status'
                            aria-hidden='true'
                          ></span>
                          Submitting...
                        </>
                      ) : (
                        'Finish'
                      )}
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      {/* Quiz Completion Modal */}{' '}
      <QuizCompletionModal
        show={showCompletionModal}
        onHide={() => setShowCompletionModal(false)}
        completionMessage={completionMessage}
        onContinue={handleContinueAfterCompletion}
        hasMoreQuizzes={false} // This will be determined by the next quiz check
      />
    </div>
  );
};

export default QuizScreen;
