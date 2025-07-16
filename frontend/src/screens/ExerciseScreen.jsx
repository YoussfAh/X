import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { useGetExerciseDetailsQuery } from '../slices/exercisesApiSlice';
import PageTransition from '../components/animations/PageTransition';
import ExerciseContent from './ExerciseScreen/ExerciseContent';
import VideoSection from './ExerciseScreen/VideoSection';
import { historyManager } from '../utils/historyManager';
import '../assets/styles/admin.css';

const ExerciseScreen = () => {
  const { id: exerciseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Get the collection ID from the location state if navigating from a collection
  const inCollection = location.state?.inCollection || false;
  const workoutCollection = location.state?.workoutCollection || null;

  // Add the current exercise to the history
  useEffect(() => {
    historyManager.addToHistory({
      type: 'exercise',
      id: exerciseId,
      timestamp: Date.now(),
    });
  }, [exerciseId]);

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Theme detection
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

  const {
    data: exercise,
    isLoading,
    error,
  } = useGetExerciseDetailsQuery(exerciseId);

  if (isLoading) {
    return (
      <PageTransition>
        <Container>
          <Loader />
        </Container>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <Container>
          <Message variant='danger'>
            {error?.data?.message || error.error}
          </Message>
        </Container>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Container fluid className={isMobile ? 'px-1' : 'px-2'}>
        <Row className='g-0'>
          <Col>
            <ExerciseContent
              exercise={exercise}
              isDarkMode={isDarkMode}
              inCollection={inCollection}
              exerciseId={exerciseId}
              workoutCollection={workoutCollection}
            />
            <VideoSection
              exercise={exercise}
              isDarkMode={isDarkMode}
              inCollection={inCollection}
              exerciseId={exerciseId}
            />
          </Col>
        </Row>
      </Container>
    </PageTransition>
  );
};

export default ExerciseScreen;
