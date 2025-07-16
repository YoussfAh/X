import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaCheckCircle, FaStar, FaArrowRight, FaHome } from 'react-icons/fa';
import './QuizCompletionModal.css';

const QuizCompletionModal = ({ show, onHide, completionMessage, onContinue, hasMoreQuizzes = false }) => {
  // Prevent modal from closing accidentally
  const handleModalClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Don't close unless explicitly called
  };

  return (
    <Modal 
      show={show} 
      onHide={handleModalClose} // Prevent accidental closing
      centered 
      backdrop="static" // Prevent clicking outside to close
      keyboard={false} // Prevent ESC key closing
      size="md"
      className="quiz-completion-modal"
      fullscreen="sm-down" // Full screen on small devices
    >
      <Modal.Body className="p-0">
        <div className="completion-container">
          {/* Professional Header */}
          <div className="completion-header">
            <div className="success-indicator">
              <FaCheckCircle className="success-icon" />
              <div className="success-ripple"></div>
            </div>
            <h2 className="completion-title">Quiz Completed!</h2>
            <p className="completion-subtitle">Excellent work on finishing the assessment</p>
          </div>
          
          {/* Content Section */}
          <div className="completion-content">
            {/* Custom Message Card */}
            <div className="message-card">
              <div className="message-icon">
                <FaStar className="star-icon" />
              </div>
              <p className="completion-message">
                {completionMessage || 'Thank you for completing the quiz! Your responses have been saved and your profile is being updated.'}
              </p>
            </div>

            {/* Professional Divider */}
            <div className="professional-divider">
              <div className="divider-line"></div>
            </div>

            {/* Next Steps */}
            <div className="next-steps">
              <h4 className="next-steps-title">What's Next?</h4>
              <ul className="next-steps-list">
                <li>Your responses are being processed</li>
                {hasMoreQuizzes ? (
                  <li>✨ Your next quiz is being prepared</li>
                ) : (
                  <li>Your profile will be updated shortly</li>
                )}
                <li>Personalized recommendations are being prepared</li>
              </ul>
            </div>
          </div>

          {/* Action Footer */}
          <div className="completion-footer">
            <Button 
              variant={hasMoreQuizzes ? "success" : "primary"}
              size="lg" 
              onClick={onContinue}
              className="continue-btn"
            >
              {hasMoreQuizzes ? (
                <>
                  <FaArrowRight className="btn-icon" />
                  Continue to Next Quiz
                </>
              ) : (
                <>
                  <FaHome className="btn-icon" />
                  Go to Home
                </>
              )}
            </Button>
            
            <p className="footer-note">
              {hasMoreQuizzes 
                ? "Tap above to continue with your next assessment"
                : "Tap above to return to your home screen"
              }
            </p>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default QuizCompletionModal;
