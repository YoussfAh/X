// Examples of applying FullHeightContainer to different screen types

// 1. WORKOUT DASHBOARD SCREEN EXAMPLE
import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import Meta from '../components/Meta';
import { AnimatedScreenWrapper, FadeIn } from '../components/animations';
import FullHeightContainer from '../components/layout/FullHeightContainer';

const WorkoutDashboardScreen = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <AnimatedScreenWrapper>
      <Meta title='Workout Dashboard' />
      <FullHeightContainer 
        isMobile={isMobile}
        padding="md"
        className="workout-dashboard"
      >
        <FadeIn delay={0.1}>
          <Row>
            <Col md={12}>
              <Card>
                <Card.Body>
                  <h1>Workout Dashboard</h1>
                  {/* Workout content fills the full height */}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </FadeIn>
      </FullHeightContainer>
    </AnimatedScreenWrapper>
  );
};

// 2. PROFILE SCREEN EXAMPLE (Form-heavy page)
const ProfileScreen = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  return (
    <AnimatedScreenWrapper>
      <Meta title='Profile' />
      <FullHeightContainer 
        fluid={false} // Use regular container for forms
        isMobile={isMobile}
        padding="lg"
        className="profile-screen"
      >
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card>
              <Card.Body>
                <h2>User Profile</h2>
                {/* Form content */}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </FullHeightContainer>
    </AnimatedScreenWrapper>
  );
};

// 3. LIST/TABLE SCREEN EXAMPLE
const ProductListScreen = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  return (
    <AnimatedScreenWrapper>
      <Meta title='Products' />
      <FullHeightContainer 
        isMobile={isMobile}
        padding="sm"
        className="product-list"
      >
        <Row>
          <Col md={12}>
            <Card className="h-100">
              <Card.Header>
                <h3>Products</h3>
              </Card.Header>
              <Card.Body className="d-flex flex-column">
                <div className="flex-grow-1">
                  {/* Table or list content that can scroll */}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </FullHeightContainer>
    </AnimatedScreenWrapper>
  );
};

// 4. ADD/EDIT FORM SCREEN EXAMPLE
const AddDietEntryScreen = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  return (
    <AnimatedScreenWrapper>
      <Meta title='Add Diet Entry' />
      <FullHeightContainer 
        isMobile={isMobile}
        padding="md"
        style={{ backgroundColor: 'var(--background-color)' }}
      >
        <Row className="justify-content-center h-100">
          <Col md={10} lg={8} className="d-flex align-items-center">
            <Card className="w-100">
              <Card.Body>
                <h2>Add Diet Entry</h2>
                {/* Form content */}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </FullHeightContainer>
    </AnimatedScreenWrapper>
  );
};

// 5. RESPONSIVE DASHBOARD WITH THEME SUPPORT
const SleepTrackerScreen = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );

  const themeColors = {
    background: isDarkMode ? '#000000' : '#f8fafc',
    cardBg: isDarkMode ? '#0D0D0D' : '#ffffff',
    text: isDarkMode ? '#E2E8F0' : '#1A202C',
  };

  return (
    <AnimatedScreenWrapper>
      <Meta title='Sleep Tracker' />
      <FullHeightContainer 
        isMobile={isMobile}
        padding={isMobile ? "sm" : "lg"}
        style={{ backgroundColor: themeColors.background }}
        className="sleep-tracker"
      >
        <Row className="h-100">
          <Col md={12} className="d-flex flex-column">
            {/* Header */}
            <div className="mb-3">
              <h1 style={{ color: themeColors.text }}>Sleep Tracker</h1>
            </div>
            
            {/* Main content that grows to fill space */}
            <div className="flex-grow-1">
              <Card style={{ backgroundColor: themeColors.cardBg, height: '100%' }}>
                <Card.Body className="d-flex flex-column">
                  <div className="flex-grow-1">
                    {/* Sleep tracking content */}
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </FullHeightContainer>
    </AnimatedScreenWrapper>
  );
};

export {
  WorkoutDashboardScreen,
  ProfileScreen,
  ProductListScreen,
  AddDietEntryScreen,
  SleepTrackerScreen
};
