import React, { useState } from 'react';
import { Row, Col, Card, Nav, Container } from 'react-bootstrap';
import {
  FaImage,
  FaCog,
  FaChevronLeft,
  FaGlobe,
  FaStar,
  FaQuestionCircle,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

import SystemCarouselManager from '../../components/admin/SystemCarouselManager';
import SystemGeneralManager from '../../components/admin/SystemGeneralManager';
import SystemMainHeroManager from '../../components/admin/SystemMainHeroManager';
import HeroPreview from '../../components/admin/HeroPreview';
import Meta from '../../components/Meta';
import { useStaticAppSettings } from '../../hooks/useStaticAppSettings';
import { useSelector } from 'react-redux';
import { updateDynamicFavicon } from '../../utils/faviconUtils';

const SystemSettingsScreen = () => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('systemSettingsLastTab') || 'general';
  });

  React.useEffect(() => {
    localStorage.setItem('systemSettingsLastTab', activeTab);
  }, [activeTab]);

  // Mobile detection
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Get settings with safe destructuring to prevent null reference errors
  const settings = useStaticAppSettings();
  const {
    colorScheme: rawColorScheme,
    siteName,
    headerImage,
    faviconImage,
    faviconSvgCode,
    customTabFavicon
  } = settings || {};

  // Safe colorScheme with defaults to prevent null reference errors
  const safeColorScheme = rawColorScheme || {
    primaryColor: '#4F46E5',
    secondaryColor: '#7C3AED'
  };

  const { userInfo } = useSelector((state) => state.auth);

  const [liveHeroSettings, setLiveHeroSettings] = useState(null);
  const [forceRefreshKey, setForceRefreshKey] = useState(0);

  React.useEffect(() => {
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

    return () => {
      observer.disconnect();
    };
  }, []);



  React.useEffect(() => {
    if (liveHeroSettings) {
      setForceRefreshKey((prev) => prev + 1);
    }
  }, [liveHeroSettings]);

  // Update browser tab with dynamic settings
  React.useEffect(() => {
    // Wait for settings to load before updating
    if (siteName) {
      console.log('SystemSettingsScreen - siteName:', siteName);
      console.log('SystemSettingsScreen - faviconImage:', faviconImage);
      console.log('SystemSettingsScreen - faviconSvgCode:', faviconSvgCode ? 'Present' : 'None');
      console.log('SystemSettingsScreen - customTabFavicon:', customTabFavicon);
      
      // Update favicon using the new dynamic favicon function
      // Priority: Custom Tab Favicon > SVG code > URL > default
      updateDynamicFavicon(faviconImage, faviconSvgCode, customTabFavicon);
    }
  }, [siteName, faviconImage, faviconSvgCode, customTabFavicon]);

  const cardGradientStyle = {
    background: isDarkMode
      ? 'linear-gradient(135deg, #111111 0%, #000000 100%)'
      : 'linear-gradient(135deg, #f5f7fa 0%, #e8eaec 100%)',
    borderColor: isDarkMode ? '#222222' : '#d1d9e6',
    boxShadow: isDarkMode
      ? '0 8px 16px rgba(0, 0, 0, 0.5)'
      : '0 8px 16px rgba(0, 0, 0, 0.05)',
    color: isDarkMode ? '#FFFFFF' : '#333333',
  };

  const headerStyle = {
    background: isDarkMode
      ? 'linear-gradient(90deg, #111111 0%, #000000 100%)'
      : 'linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%)',
    borderBottom: isDarkMode ? '1px solid #222222' : '1px solid #dee2e6',
  };

  const activeNavStyle = {
    background: isDarkMode ? '#222222' : '#ffffff',
    borderColor: isDarkMode ? safeColorScheme.primaryColor : '#dee2e6',
    color: isDarkMode ? '#FFFFFF' : '#495057',
  };

  const inactiveNavStyle = {
    background: 'transparent',
    borderColor: 'transparent',
    color: isDarkMode ? safeColorScheme.primaryColor : '#6c757d',
  };

  const showPreview = activeTab === 'main-hero';

  return (
    <Container fluid className="px-1">
      <Meta 
        title={`System Settings | Grindx Admin`} 
        useDynamicFavicon={true}
      />

      <Row className='mb-3'>
        <Col>
          <div className='d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center py-2 gap-2'>
            <h1 className='h3 mb-0 d-flex align-items-center text-white'>
              <FaCog
                className='me-2'
                style={{ color: safeColorScheme.primaryColor }}
              />
              System Settings
            </h1>
            <Link
              to='/admin'
              className={`btn ${
                isDarkMode ? 'btn-outline-light' : 'btn-outline-primary'
              } btn-sm d-flex align-items-center`}
              style={{
                borderColor: isDarkMode ? safeColorScheme.primaryColor : '',
                color: isDarkMode ? safeColorScheme.primaryColor : '',
              }}
            >
              <FaChevronLeft className='me-1' /> Back to Dashboard
            </Link>
          </div>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card
            className='mb-4 border-0 rounded-lg overflow-hidden'
            style={cardGradientStyle}
          >
            <Card.Body className='p-0'>
              <Nav
                variant='pills'
                className='p-2 p-md-3 mb-0 flex-row flex-nowrap overflow-auto'
                style={{
                  background: isDarkMode ? '#000000' : '#f8f9fa',
                  borderBottom: isDarkMode
                    ? '1px solid #222222'
                    : '1px solid #dee2e6',
                  scrollbarWidth: 'thin',
                  msOverflowStyle: 'none',
                  WebkitScrollbar: { display: 'none' },
                }}
              >
                <Nav.Item className='flex-shrink-0'>
                  <Nav.Link
                    active={activeTab === 'general'}
                    onClick={() => setActiveTab('general')}
                    className='d-flex align-items-center px-2 px-md-3 py-2 text-nowrap'
                    style={
                      activeTab === 'general'
                        ? activeNavStyle
                        : inactiveNavStyle
                    }
                  >
                    <FaGlobe className='me-1 me-md-2' />
                    <span className='d-none d-sm-inline'>General</span>
                    <span className='d-sm-none'>Gen</span>
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item className='flex-shrink-0'>
                  <Nav.Link
                    active={activeTab === 'main-hero'}
                    onClick={() => setActiveTab('main-hero')}
                    className='d-flex align-items-center px-2 px-md-3 py-2 text-nowrap'
                    style={
                      activeTab === 'main-hero'
                        ? activeNavStyle
                        : inactiveNavStyle
                    }
                  >
                    <FaStar className='me-1 me-md-2' />
                    <span className='d-none d-sm-inline'>Main Hero</span>
                    <span className='d-sm-none'>Hero</span>
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item className='flex-shrink-0'>
                  <Nav.Link
                    active={activeTab === 'carousel'}
                    onClick={() => setActiveTab('carousel')}
                    className='d-flex align-items-center px-2 px-md-3 py-2 text-nowrap'
                    style={
                      activeTab === 'carousel'
                        ? activeNavStyle
                        : inactiveNavStyle
                    }
                  >
                    <FaImage className='me-1 me-md-2' />
                    <span className='d-none d-sm-inline'>Hero Carousel</span>
                    <span className='d-sm-none'>Carousel</span>
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item className='flex-shrink-0'>
                  <Link
                    to='/admin/quiz-settings'
                    style={{ textDecoration: 'none' }}
                  >
                    <Nav.Link
                      as='div'
                      className='d-flex align-items-center px-3 py-2'
                      style={inactiveNavStyle}
                    >
                      <FaQuestionCircle className='me-1 me-md-2' />
                      <span className='d-none d-sm-inline'>
                        Onboarding Quiz
                      </span>
                    </Nav.Link>
                  </Link>
                </Nav.Item>
              </Nav>

              <div className='p-2 p-md-4'>
                {activeTab === 'general' && <SystemGeneralManager />}

                {activeTab === 'main-hero' && (
                  <SystemMainHeroManager
                    liveHeroSettings={liveHeroSettings}
                    onSettingsChange={setLiveHeroSettings}
                  />
                )}

                {activeTab === 'carousel' && <SystemCarouselManager />}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {showPreview && (
        <Row>
          <Col>
            <Card style={cardGradientStyle} className='border-0 rounded-lg'>
              <Card.Header style={headerStyle}>
                <h5 className='mb-0'>
                  <FaImage className='me-2' /> Live Preview
                </h5>
              </Card.Header>
              <Card.Body>
                <HeroPreview
                  heroSettings={liveHeroSettings}
                  userInfo={userInfo}
                  forceRefreshKey={forceRefreshKey}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default SystemSettingsScreen;
