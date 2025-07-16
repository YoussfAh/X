import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Row, Col } from 'react-bootstrap';
import Meta from '../components/Meta';
import { FaDumbbell, FaArrowRight, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { useStaticAppSettings } from '../hooks/useStaticAppSettings';

const LandingScreen = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const { siteName } = useStaticAppSettings(); // Get app name from settings

    useEffect(() => {
        // Set loaded state immediately for faster animations
        setIsLoaded(true);

        // Check if we need to add animate.css
        if (!document.querySelector('link[href*="animate.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css';
            document.head.appendChild(link);
        }
    }, []);

    return (
        <>
            <Meta title={`${siteName} - Elevate Your Fitness Journey`} description="Transform your body, elevate your mind with the ultimate gym experience" />

            {/* Authentication buttons in top-right corner */}
            <Container fluid className="position-absolute" style={{ top: '10px', zIndex: 10 }}>
                <Row className="justify-content-end pe-3">
                    <Col xs="auto">
                        <Link to="/login" className="btn btn-outline-light btn-sm me-2">
                            <FaSignInAlt className="me-1" /> Login
                        </Link>
                        <Link to="/register" className="btn btn-outline-light btn-sm">
                            <FaUserPlus className="me-1" /> Register
                        </Link>
                    </Col>
                </Row>
            </Container>

            <div className="hero-section py-5 d-flex flex-column justify-content-center align-items-center text-center"
                style={{
                    minHeight: '100vh',
                    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(https://images.unsplash.com/photo-1623874106686-5be2b325c8f1?q=80&w=1587&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: 'white',
                    position: 'relative'
                }}>
                <div className="container">
                    <div className={`${isLoaded ? 'animate__animated animate__fadeInDown animate__faster' : ''}`}>
                        <h1 className="display-3 fw-bold mb-4">TRANSFORM WITH <span style={{ color: '#ff4d4d' }}>{siteName}</span></h1>
                        <p className={`lead mb-5 px-md-5 mx-md-5 ${isLoaded ? 'animate__animated animate__fadeIn animate__faster' : ''}`}>
                            Your ultimate fitness companion. Track workouts, set goals, and connect with trainers all in one powerful platform.
                        </p>
                    </div>

                    <div className={`d-flex justify-content-center gap-3 flex-wrap ${isLoaded ? 'animate__animated animate__fadeInUp animate__faster' : ''}`}>
                        <Button
                            as={Link}
                            to="/login"
                            className="btn btn-danger btn-lg px-5 py-3 shadow d-flex align-items-center justify-content-center"
                            style={{
                                borderRadius: '50px',
                                minWidth: '220px',
                                backgroundColor: '#ff4d4d'
                            }}
                        >
                            <FaDumbbell className="me-2" /> START YOUR JOURNEY
                        </Button>
                    </div>

                    <div className={`position-absolute bottom-0 pb-4 w-100 text-center ${isLoaded ? 'animate__animated animate__fadeIn animate__faster' : ''}`} style={{ left: 0 }}>
                        <p className="text-white mb-2">Ready to reach your fitness goals?</p>
                        <Link to="/login" className="text-white text-decoration-none d-inline-flex align-items-center login-arrow-link">
                            <span className="me-2">Login to access your personalized {siteName} fitness program</span>
                            <FaArrowRight className="login-arrow" style={{ 
                                transition: 'transform 0.5s ease',
                                transform: 'translateX(0)',
                            }} />
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LandingScreen;
