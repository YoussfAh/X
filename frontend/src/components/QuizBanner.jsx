import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaQuestionCircle, FaArrowRight } from 'react-icons/fa';
import './QuizBanner.css';

function QuizBanner({ message, quizId, quizName }) {
    const navigate = useNavigate();
    const messageRef = useRef(null);
    const [showDescription, setShowDescription] = useState(false);

    const handleTakeQuiz = () => {
        navigate('/quiz');
    };

    const displayMessage = message || `You have a new quiz available: ${quizName || 'Personalized Quiz'}`;
    const descriptionText = "Complete your personalized quiz to unlock your custom collections";

    useEffect(() => {
        const checkMessageHeight = () => {
            if (messageRef.current && window.innerWidth >= 768) {
                const messageElement = messageRef.current;
                const lineHeight = parseInt(window.getComputedStyle(messageElement).lineHeight);
                const messageHeight = messageElement.offsetHeight;
                const isMultiLine = messageHeight > lineHeight * 1.2; // Allow some tolerance
                setShowDescription(!isMultiLine && displayMessage.length < 80);
            } else {
                setShowDescription(false);
            }
        };

        checkMessageHeight();
        window.addEventListener('resize', checkMessageHeight);
        return () => window.removeEventListener('resize', checkMessageHeight);
    }, [displayMessage]);

    if (!message && !quizName) {
        return null;
    }

    return (
        <Alert 
            variant="primary" 
            className="d-flex align-items-center justify-content-between quiz-banner mb-4"
        >
            <div className="d-flex align-items-center flex-grow-1">
                {/* <FaQuestionCircle 
                    className="quiz-banner-icon"
                /> */}
                <div className="quiz-banner-text-container">
                    <div className="quiz-banner-text" ref={messageRef}>
                        {displayMessage}
                    </div>
                    {showDescription && (
                        <div className="quiz-banner-description">
                            {descriptionText}
                        </div>
                    )}
                </div>
            </div>
            <div className="quiz-banner-actions ms-3">
                <Button 
                    variant="light" 
                    onClick={handleTakeQuiz}
                    className="take-quiz-btn"
                >
                    <span className="take-quiz-btn-text">Start Now</span>
                    <FaArrowRight className="take-quiz-btn-icon ms-1" />
                </Button>
            </div>
        </Alert>
    );
}

export default React.memo(QuizBanner); 