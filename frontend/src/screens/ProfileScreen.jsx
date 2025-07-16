import React, { useEffect, useState } from 'react';
import { format } from 'date-fns'; // Add the import for date formatting
import {
  Table,
  Form,
  Button,
  Row,
  Col,
  Card,
  Badge,
  Container,
  Nav,
  InputGroup,
  Alert,
} from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
// Import animation components
import AnimatedScreenWrapper from '../components/animations/AnimatedScreenWrapper';
import FadeIn from '../components/animations/FadeIn';
import StaggeredList from '../components/animations/StaggeredList';
import '../../src/assets/styles/animations.css';
import {
  FaTimes,
  FaCheck,
  FaLock,
  FaUnlock,
  FaKey,
  FaCalendarAlt,
  FaHistory,
  FaExternalLinkAlt,
  FaLayerGroup,
  FaCode,
  FaUserClock,
  FaUser,
  FaEnvelope,
  FaLockOpen,
  FaWhatsapp,
  FaRunning,
  FaBullseye,
  FaMedkit,
  FaChartLine,
  FaFire,
  FaWeightHanging,
  FaAngleUp,
  FaArrowUp,
  FaMedal,
  FaCalendarDay,
  FaCalendarWeek,
  FaCubes,
  FaQuestionCircle,
  FaArrowRight,
  FaArrowsAltV,
  FaComment,
  FaInfoCircle,
  FaAngleDown,
  FaSync,
  FaInstagram,
  FaFacebook,
  FaLink,
  FaImage,
  FaEdit,
  FaStar,
  FaChevronUp,
  FaChevronDown,
} from 'react-icons/fa';

import { showSuccessToast, showErrorToast } from '../utils/toastConfig';
import Message from '../components/Message';
import Loader from '../components/Loader';
import {
  useProfileMutation,
  useRefreshUserDataQuery,
  useGetUserAssignedCollectionsQuery,
} from '../slices/usersApiSlice';
import { useGetActiveQuizForUserQuery } from '../slices/quizApiSlice';
import { useGetMyOrdersQuery } from '../slices/ordersApiSlice';
import { setCredentials } from '../slices/authSlice';
import { Link } from 'react-router-dom';
import { useGetCollectionsQuery } from '../slices/collectionsApiSlice';
import CarouselImageManager from '../components/CarouselImageManager';
import { useGetQuizQuery } from '../slices/quizApiSlice';
import ProgressImageSection from '../components/ProgressImageSection';

const ProfileScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('');
  const [injuries, setInjuries] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [whatsAppPhoneNumber, setWhatsAppPhoneNumber] = useState('');
  const [instagramUsername, setInstagramUsername] = useState('');
  const [facebookProfile, setFacebookProfile] = useState('');
  const [showAssigned, setShowAssigned] = useState(false);
  const [showAccessed, setShowAccessed] = useState(false);
  const [hasLoadedAssigned, setHasLoadedAssigned] = useState(false);
  const [hasLoadedAccessed, setHasLoadedAccessed] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const { data: orders, isLoading, error } = useGetMyOrdersQuery();
  const { data: quizData, isLoading: isQuizLoading } = useGetQuizQuery();
  const { data: activeQuiz } = useGetActiveQuizForUserQuery(undefined, {
    skip: !userInfo,
  });

  const [updateProfile, { isLoading: loadingUpdateProfile }] =
    useProfileMutation();

  const { data: refreshedUserData, isLoading: isRefreshingUser } =
    useRefreshUserDataQuery(undefined, {
      skip: !userInfo,
      refetchOnMountOrArgChange: true,
    });

  const { data: collections, isLoading: collectionsLoading } =
    useGetCollectionsQuery(undefined, { skip: !hasLoadedAccessed });

  const { data: assignedCollections, isLoading: assignedLoading } =
    useGetUserAssignedCollectionsQuery(undefined, { skip: !hasLoadedAssigned });

  useEffect(() => {
    if (userInfo) {
      setName(userInfo.name);
      setEmail(userInfo.email);
      // Set fitness profile data if available
      setAge(userInfo.age || '');
      setFitnessGoal(userInfo.fitnessGoal || '');
      setInjuries(userInfo.injuries || '');
      setAdditionalInfo(userInfo.additionalInfo || '');
      setWhatsAppPhoneNumber(userInfo.whatsAppPhoneNumber || '');
      setInstagramUsername(userInfo.instagramUsername || '');
      setFacebookProfile(userInfo.facebookProfile || '');
    }
  }, [userInfo]);

  useEffect(() => {
    if (refreshedUserData && userInfo) {
      dispatch(setCredentials(refreshedUserData));
    }
  }, [refreshedUserData, userInfo, dispatch]);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfile({
        _id: userInfo._id,
        name,
        email,
        age: age ? Number(age) : null,
        fitnessGoal,
        injuries,
        additionalInfo,
        whatsAppPhoneNumber,
        instagramUsername,
        facebookProfile,
      }).unwrap();

      dispatch(setCredentials({ ...res }));
      setName(res.name);
      setEmail(res.email);
      setAge(res.age || '');
      setFitnessGoal(res.fitnessGoal || '');
      setInjuries(res.injuries || '');
      setAdditionalInfo(res.additionalInfo || '');
      setWhatsAppPhoneNumber(res.whatsAppPhoneNumber || '');
      setInstagramUsername(res.instagramUsername || '');
      setFacebookProfile(res.facebookProfile || '');

      showSuccessToast('Profile updated successfully');
    } catch (err) {
      showErrorToast(err?.data?.message || err.error);
    }
  };

  // Add state for visual enhancements
  const [activeTab, setActiveTab] = useState('table'); // 'table' or 'cards'
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );

  // Define consistent color theme for both dark and light modes
  const themeColors = {
    dark: {
      background: '#000000', // True black for AMOLED
      cardBg: '#0a0a0a', // Near black for cards
      border: '#334155', // Slate border
      text: '#ffffff', // White text
      textSecondary: '#cbd5e1', // Light gray text for secondary content
      accent: '#8B5CF6', // Purple accent
      inputBg: '#111111', // Very dark input background
      shadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
    },
    light: {
      background: '#F8F9FC', // Soft off-white background
      cardBg: '#FFFFFF', // White card background for contrast
      border: '#E2E8F0', // Soft gray border
      text: '#1E293B', // Dark slate text for better readability
      textSecondary: '#64748B', // Medium slate for secondary text
      accent: '#8B5CF6', // Keep same purple accent for consistency
      inputBg: '#FFFFFF', // White input background
      shadow: '0 10px 25px rgba(148, 163, 184, 0.1)', // Subtle shadow
    },
  };

  // Define styles for components
  const cardHeaderStyle = {
    backgroundColor: isDarkMode
      ? themeColors.dark.cardBg
      : themeColors.light.cardBg,
    borderBottom: `1px solid ${
      isDarkMode ? themeColors.dark.border : themeColors.light.background
    }`,
    padding: '1.25rem',
  };

  const navTabStyle = {
    color: isDarkMode ? themeColors.dark.textSecondary : '#64748b',
    backgroundColor: 'transparent',
    border: 'none',
    padding: '0.75rem 1.25rem',
    borderRadius: '8px',
    transition: 'all 0.2s ease-in-out',
  };

  const activeNavTabStyle = {
    ...navTabStyle,
    color: isDarkMode ? themeColors.dark.text : '#1e293b',
    backgroundColor: isDarkMode
      ? themeColors.dark.inputBg
      : themeColors.light.background,
  };

  // Effect: Update theme state when document's theme attribute changes
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

  // Modern color scheme with gradients
  const primaryColor = '#6e44b2'; // Purple
  const secondaryColor = '#4a90e2'; // Blue
  const accentColor = '#6e44b2';
  const accentColorLight = 'rgba(110, 68, 178, 0.1)';
  const accentGradient = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;

  // Style objects for consistent UI design
  const pageStyle = {
    background: isDarkMode
      ? 'linear-gradient(135deg, #1a1f2c 0%, #2d3748 100%)'
      : 'linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)',
    borderRadius: '20px',
    padding: '25px',
    marginBottom: '30px',
    boxShadow: isDarkMode
      ? '0 10px 25px rgba(0, 0, 0, 0.2)'
      : '0 10px 25px rgba(0, 0, 0, 0.05)',
  };

  const cardStyle = {
    backgroundColor: isDarkMode ? '#000000' : '#fff',
    color: isDarkMode ? '#fff' : 'inherit',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: isDarkMode
      ? '0 8px 30px rgba(0, 0, 0, 0.7)'
      : '0 4px 20px rgba(0, 0, 0, 0.1)',
    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
    transition: 'all 0.3s ease',
  };

  const gradientCardStyle = {
    ...cardStyle,
    backgroundImage: isDarkMode
      ? 'linear-gradient(135deg, #000000 0%, #121212 100%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  };

  const headerStyle = {
    fontWeight: '700',
    letterSpacing: '-0.02em',
    fontSize: '1.75rem',
    marginTop: '1rem',
    marginBottom: '1.5rem',
    color: isDarkMode ? '#fff' : '#333',
    display: 'flex',
    alignItems: 'center',
    textTransform: 'uppercase',
  };

  const formControlStyle = {
    backgroundColor: isDarkMode ? '#0a0a0a' : '#fff',
    border: `1px solid ${
      isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
    }`,
    borderRadius: '12px',
    padding: '12px 15px',
    color: isDarkMode ? '#fff' : '#333',
    transition: 'all 0.3s ease',
  };

  const buttonStyle = {
    backgroundImage: accentGradient,
    border: 'none',
    borderRadius: '12px',
    padding: '12px 25px',
    fontWeight: '600',
    boxShadow: isDarkMode
      ? '0 8px 20px rgba(110, 68, 178, 0.4)'
      : '0 8px 15px rgba(110, 68, 178, 0.2)',
    transition: 'all 0.3s ease',
  };

  const tableCellStyle = {
    padding: '15px',
    verticalAlign: 'middle',
    color: isDarkMode ? '#fff' : 'inherit',
  };

  const tableHeadStyle = {
    backgroundColor: isDarkMode
      ? 'rgba(110, 68, 178, 0.15)'
      : 'rgba(110, 68, 178, 0.05)',
    color: isDarkMode ? '#fff' : '#333',
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: '0.8rem',
    letterSpacing: '0.05em',
  };

  const tableStyle = {
    borderCollapse: 'separate',
    borderSpacing: '0 8px',
  };

  // Add formatDate function
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Add handleCollectionClick function
  const handleCollectionClick = (collectionId) => {
    navigate(`/collections/${collectionId}`);
  };

  // Update the getFeelingStyling function with enhanced AMOLED-optimized colors
  const getFeelingStyling = (feeling) => {
    switch (feeling) {
      case 'easy':
        return {
          bg: isDarkMode
            ? 'rgba(16, 185, 129, 0.15)'
            : 'rgba(16, 185, 129, 0.1)',
          color: isDarkMode ? '#34d399' : '#059669',
          borderRadius: '6px',
          padding: '4px 8px',
          fontSize: '0.75rem',
          fontWeight: '600',
        };
      case 'moderate':
        return {
          bg: isDarkMode
            ? 'rgba(59, 130, 246, 0.15)'
            : 'rgba(59, 130, 246, 0.1)',
          color: isDarkMode ? '#60a5fa' : '#2563eb',
          borderRadius: '6px',
          padding: '4px 8px',
          fontSize: '0.75rem',
          fontWeight: '600',
        };
      case 'hard':
        return {
          bg: isDarkMode
            ? 'rgba(245, 158, 11, 0.15)'
            : 'rgba(245, 158, 11, 0.1)',
          color: isDarkMode ? '#fbbf24' : '#d97706',
          borderRadius: '6px',
          padding: '4px 8px',
          fontSize: '0.75rem',
          fontWeight: '600',
        };
      case 'extreme':
        return {
          bg: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
          color: isDarkMode ? '#f87171' : '#dc2626',
          borderRadius: '6px',
          padding: '4px 8px',
          fontSize: '0.75rem',
          fontWeight: '600',
        };
      default:
        return {
          bg: isDarkMode
            ? 'rgba(107, 114, 128, 0.15)'
            : 'rgba(107, 114, 128, 0.1)',
          color: isDarkMode ? '#9ca3af' : '#4b5563',
          borderRadius: '6px',
          padding: '4px 8px',
          fontSize: '0.75rem',
          fontWeight: '600',
        };
    }
  };

  // Render a collection card for card view
  const renderCollectionCard = (collection) => {
    return (
      <Col
        key={collection._id || collection.collectionId}
        xs={12}
        sm={6}
        md={4}
      >
        <Card
          style={{
            ...gradientCardStyle,
            height: '100%',
            background: isDarkMode
              ? 'linear-gradient(145deg, #1a1a1a, #0a0a0a)'
              : 'linear-gradient(145deg, #ffffff, #f8f9fa)',
            border: isDarkMode
              ? '1px solid rgba(255,255,255,0.05)'
              : '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <Card.Body style={{ padding: '15px' }}>
            <div className='d-flex justify-content-between align-items-start mb-3'>
              <div className='d-flex align-items-center' style={{ flex: 1 }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isDarkMode
                      ? 'rgba(110, 68, 178, 0.15)'
                      : 'rgba(110, 68, 178, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                  }}
                >
                  <FaLayerGroup
                    style={{
                      color: accentColor,
                      fontSize: '1rem',
                    }}
                  />
                </div>
                <h6
                  style={{
                    margin: 0,
                    fontWeight: '600',
                    color: isDarkMode ? '#fff' : '#333',
                    fontSize: '0.95rem',
                  }}
                >
                  {collection.name}
                </h6>
              </div>
              <Badge
                bg='success'
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  padding: '4px 8px',
                  borderRadius: '6px',
                }}
              >
                Accessed
              </Badge>
            </div>

            <div
              style={{
                color: isDarkMode ? '#a0aec0' : '#64748b',
                fontSize: '0.85rem',
              }}
            >
              <div
                className='d-flex align-items-center mb-2'
                style={{
                  color: accentColor,
                  fontWeight: '500',
                }}
              >
                <FaCode className='me-2' />
                Code: {collection.accessCode}
              </div>

              {collection.accessDate && (
                <div className='d-flex align-items-center mb-2'>
                  <FaCalendarAlt className='me-2' />
                  Accessed On: {format(new Date(collection.accessDate), 'PPP')}
                </div>
              )}

              {collection.accessedFrom && (
                <div className='d-flex align-items-center'>
                  <FaUserClock className='me-2' />
                  Accessed By: {collection.accessedFrom}
                </div>
              )}
            </div>

            <Button
              variant='primary'
              size='sm'
              onClick={() => handleCollectionClick(collection.collectionId)}
              style={{
                ...buttonStyle,
                width: '100%',
                marginTop: '15px',
                fontSize: '0.8rem',
                padding: '8px 12px',
                backgroundImage:
                  'linear-gradient(135deg, #4A00E0 0%, #8E2DE2 100%)',
              }}
            >
              <FaExternalLinkAlt className='me-2' /> View Collection
            </Button>
          </Card.Body>
        </Card>
      </Col>
    );
  };

  const renderAssignedCollections = () => {
    if (assignedLoading) return <Loader />;

    const getFeelingStyling = (feeling) => {
      if (!feeling)
        return { bg: 'light', color: 'dark', borderRadius: '4px' };
      const baseStyle = { borderRadius: '4px', padding: '4px 8px' };
      switch (feeling.toLowerCase()) {
        case 'easy':
          return {
            ...baseStyle,
            bg: 'success',
            color: 'white',
            fontWeight: 'bold',
          };
        case 'moderate':
          return {
            ...baseStyle,
            bg: 'info',
            color: 'white',
            fontWeight: 'bold',
          };
        case 'hard':
          return {
            ...baseStyle,
            bg: 'warning',
            color: 'dark',
            fontWeight: 'bold',
          };
        case 'extreme':
          return {
            ...baseStyle,
            bg: 'danger',
            color: 'white',
            fontWeight: 'bold',
          };
        default:
          return {
            ...baseStyle,
            bg: 'secondary',
            color: 'white',
            fontWeight: 'bold',
          };
      }
    };

    if (assignedCollections && assignedCollections.length > 0) {
      return (
        <StaggeredList>
          <Row>
            {assignedCollections.map((collection) =>
              renderCollectionCard(collection)
            )}
          </Row>
        </StaggeredList>
      );
    } else {
      return (
        <Message variant='info'>
          You have not been assigned any collections yet.
        </Message>
      );
    }
  };

  const handleCarouselSlidesUpdate = async (newSlides) => {
    try {
      const res = await updateProfile({
        _id: userInfo._id,
        carouselSlides: newSlides,
      }).unwrap();
      dispatch(setCredentials({ ...res }));
      showSuccessToast('Carousel slides updated successfully');
    } catch (err) {
      showErrorToast(err?.data?.message || err.error);
    }
  };

  const handleShowAssigned = () => {
    setShowAssigned(!showAssigned);
    if (!hasLoadedAssigned) {
      setHasLoadedAssigned(true); // Trigger fetch
    }
  };

  const handleShowAccessed = () => {
    setShowAccessed(!showAccessed);
    if (!hasLoadedAccessed) {
      setHasLoadedAccessed(true);
    }
  };

  const outlineButtonStyle = {
    borderColor: accentColor,
    color: accentColor,
    borderRadius: '12px',
    padding: '12px 25px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    ':hover': {
      backgroundColor: accentColorLight,
      color: accentColor,
    },
  };

  const toggleButtonStyle = {
    background: isDarkMode
      ? 'rgba(110, 68, 255, 0.1)'
      : 'rgba(110, 68, 255, 0.05)',
    border: `1px solid ${accentColor}40`,
    color: accentColor,
    padding: '8px 16px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    boxShadow: isDarkMode
      ? '0 2px 4px rgba(0,0,0,0.2)'
      : '0 2px 4px rgba(0,0,0,0.1)',
    ':hover': {
      background: isDarkMode
        ? 'rgba(110, 68, 255, 0.15)'
        : 'rgba(110, 68, 255, 0.1)',
      transform: 'translateY(-1px)',
      boxShadow: isDarkMode
        ? '0 4px 8px rgba(0,0,0,0.3)'
        : '0 4px 8px rgba(0,0,0,0.15)',
    },
  };

  // Return statement with improved container and responsive layout
  return (
    <AnimatedScreenWrapper>
      {/* <Row className='align-items-center mb-4'>
          <Col>
            <FadeIn>
              <h1 className='my-3'>User Profile</h1>
            </FadeIn>
          </Col>
        </Row> */}
      {/* All content will be inside this column */}
      <Card className='mb-4'>
        {/* Profile Header */}
        <div
          className='profile-header p-3 p-md-4'
          style={{
            ...gradientCardStyle,
            borderRadius: '12px',
            marginBottom: '20px',
          }}
        >
          <div className='d-flex flex-column flex-md-row align-items-md-center justify-content-between'>
            <h1
              className='mb-3 mb-md-0'
              style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                background: accentGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0',
              }}
            >
              <FaUser
                className='me-2'
                style={{ WebkitTextFillColor: accentColor }}
              />
              Your Profile
            </h1>
            <div>
              <h4
                style={{
                  color: isDarkMode ? '#f0f0f0' : '#333',
                  fontSize: '1rem',
                  fontWeight: '600',
                  margin: 0,
                }}
              >
                Welcome back, {name.split(' ')[0]}
              </h4>
              <p
                style={{
                  color: isDarkMode
                    ? 'rgba(255,255,255,0.6)'
                    : 'rgba(0,0,0,0.6)',
                  fontSize: '0.8rem',
                  margin: 0,
                }}
              >
                {email}
              </p>
            </div>
          </div>
        </div>

        {/* Quiz Section */}
        {activeQuiz && (
          <div
            className='quiz-section p-2 mx-1 mb-3'
            style={{
              background: accentGradient,
              borderRadius: '12px',
              color: 'white',
            }}
          >
            <div className='d-flex align-items-center justify-content-between'>
              <div className='d-flex align-items-center'>
                <FaQuestionCircle
                  style={{
                    fontSize: '1rem',
                    marginRight: '8px',
                    opacity: 0.9,
                  }}
                  className='d-none d-sm-block'
                />
                <h4
                  style={{
                    margin: 0,
                    fontWeight: '600',
                    fontSize: '0.85rem',
                  }}
                  className='mb-0'
                >
                  {activeQuiz.name || 'Take Your Quiz'}
                </h4>
              </div>
              <Button
                variant='light'
                onClick={() => navigate('/quiz')}
                style={{
                  borderRadius: '8px',
                  fontWeight: '500',
                  padding: '4px 10px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  fontSize: '0.75rem',
                  background: isDarkMode ? '#ffffff' : '#ffffff',
                  color: accentColor,
                  whiteSpace: 'nowrap',
                }}
              >
                Take Quiz <FaArrowRight className='ms-1' size={8} />
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <Row className='g-3'>
          {/* Account and Fitness Profile Sections */}
          <Col xs={12} lg={6} className='mb-3'>
            <Card style={{ ...gradientCardStyle, height: '100%' }}>
              <Card.Body className='p-3'>
                <h3
                  className='mb-3'
                  style={{
                    color: isDarkMode ? '#f0f0f0' : '#333',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <FaEdit className='me-2' style={{ color: accentColor }} />
                  Account Information
                </h3>

                <Form onSubmit={submitHandler}>
                  {/* Account form fields */}
                  <Form.Group className='mb-4' controlId='name'>
                    <Form.Label style={{ fontWeight: '600' }}>
                      <FaUser className='me-2' style={{ color: accentColor }} />
                      Name
                    </Form.Label>
                    <Form.Control
                      type='text'
                      placeholder='Enter name'
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={formControlStyle}
                    />
                  </Form.Group>

                  <Form.Group className='mb-4' controlId='email'>
                    <Form.Label style={{ fontWeight: '600' }}>
                      <FaEnvelope className='me-2' style={{ color: accentColor }} />
                      Email Address
                    </Form.Label>
                    <Form.Control
                      type='email'
                      placeholder='Enter email'
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={formControlStyle}
                    />
                  </Form.Group>

                  <Form.Group className='mb-4' controlId='whatsAppPhoneNumber'>
                    <Form.Label style={{ fontWeight: '600' }}>
                      <FaWhatsapp className='me-2' style={{ color: accentColor }} />
                      WhatsApp Phone Number
                    </Form.Label>
                    <InputGroup style={{ borderRadius: '12px', overflow: 'hidden' }}>
                      <InputGroup.Text
                        style={{
                          backgroundColor: isDarkMode ? '#0a0a0a' : '#f8f9fa',
                          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                          color: accentColor,
                          fontWeight: '600',
                          borderTopLeftRadius: '12px',
                          borderBottomLeftRadius: '12px',
                        }}
                      >
                        +20
                      </InputGroup.Text>
                      <Form.Control
                        type='tel'
                        placeholder='Enter WhatsApp number'
                        value={whatsAppPhoneNumber}
                        onChange={(e) => setWhatsAppPhoneNumber(e.target.value)}
                        style={{
                          ...formControlStyle,
                          borderTopLeftRadius: '0',
                          borderBottomLeftRadius: '0',
                        }}
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className='mt-4 mb-2' controlId='socialMedia'>
                    <Form.Label style={{ fontWeight: '600', marginBottom: '1rem' }}>
                      <FaLink className='me-2' style={{ color: accentColor }} />
                      Social Media Links
                    </Form.Label>
                    <InputGroup className='mb-3' style={{ borderRadius: '12px', overflow: 'hidden' }}>
                      <InputGroup.Text
                        id='instagram-addon'
                        style={{
                          backgroundColor: isDarkMode ? '#0a0a0a' : '#f8f9fa',
                          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                          color: '#E1306C',
                          borderTopLeftRadius: '12px',
                          borderBottomLeftRadius: '12px',
                        }}
                      >
                        <FaInstagram />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder='Instagram username (optional)'
                        aria-label='Instagram'
                        aria-describedby='instagram-addon'
                        style={{
                          ...formControlStyle,
                          borderTopLeftRadius: '0',
                          borderBottomLeftRadius: '0',
                        }}
                        value={instagramUsername}
                        onChange={(e) => setInstagramUsername(e.target.value)}
                      />
                      {instagramUsername && (
                        <Button
                          variant='info'
                          href={`https://instagram.com/${instagramUsername}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          style={{
                            backgroundColor: '#E1306C',
                            borderColor: '#E1306C',
                            color: '#ffffff',
                            borderTopRightRadius: '12px',
                            borderBottomRightRadius: '12px',
                          }}
                        >
                          <FaInstagram className='me-1' /> View
                        </Button>
                      )}
                    </InputGroup>

                    <InputGroup style={{ borderRadius: '12px', overflow: 'hidden' }}>
                      <InputGroup.Text
                        id='facebook-addon'
                        style={{
                          backgroundColor: isDarkMode ? '#0a0a0a' : '#f8f9fa',
                          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                          color: '#1877F2',
                          borderTopLeftRadius: '12px',
                          borderBottomLeftRadius: '12px',
                        }}
                      >
                        <FaFacebook />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder='Facebook profile URL or username'
                        aria-label='Facebook'
                        aria-describedby='facebook-addon'
                        style={{
                          ...formControlStyle,
                          borderTopLeftRadius: '0',
                          borderBottomLeftRadius: '0',
                        }}
                        value={facebookProfile}
                        onChange={(e) => setFacebookProfile(e.target.value)}
                      />
                      {facebookProfile && (
                        <Button
                          variant='primary'
                          href={
                            facebookProfile.includes('facebook.com')
                              ? facebookProfile
                              : `https://facebook.com/${facebookProfile}`
                          }
                          target='_blank'
                          rel='noopener noreferrer'
                          style={{
                            backgroundColor: '#1877F2',
                            borderColor: '#1877F2',
                            borderTopRightRadius: '12px',
                            borderBottomRightRadius: '12px',
                          }}
                        >
                          <FaFacebook className='me-1' /> View
                        </Button>
                      )}
                    </InputGroup>
                  </Form.Group>

                  <div className='d-grid gap-2 mt-3'>
                    <Button
                      type='submit'
                      variant='primary'
                      style={buttonStyle}
                      disabled={loadingUpdateProfile || isRefreshingUser}
                    >
                      {loadingUpdateProfile
                        ? 'Updating...'
                        : 'Update Profile'}
                    </Button>

                    {quizData?.isActive && (
                      <Link to='/quiz' className='d-grid'>
                        <Button
                          variant='outline-secondary'
                          style={outlineButtonStyle}
                        >
                          <FaStar className='me-2' /> Take the Onboarding
                          Quiz
                        </Button>
                      </Link>
                    )}
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} lg={6} className='mb-3'>
            <Card style={{ ...gradientCardStyle, height: '100%' }}>
              <Card.Body className='p-3'>
                <h3
                  className='mb-3'
                  style={{
                    color: isDarkMode ? '#f0f0f0' : '#333',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <FaRunning
                    className='me-2'
                    style={{ color: accentColor }}
                  />
                  Fitness Profile
                </h3>

                <Form onSubmit={submitHandler}>
                  <Form.Group className='mb-4' controlId='age'>
                    <Form.Label style={{ fontWeight: '600' }}>
                      <FaUser
                        className='me-2'
                        style={{ color: accentColor }}
                      />
                      Age
                    </Form.Label>
                    <Form.Control
                      type='number'
                      placeholder='Enter your age'
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      style={formControlStyle}
                    />
                  </Form.Group>

                  <Form.Group className='mb-4' controlId='fitnessGoal'>
                    <Form.Label style={{ fontWeight: '600' }}>
                      <FaBullseye
                        className='me-2'
                        style={{ color: accentColor }}
                      />
                      Fitness Goal
                    </Form.Label>
                    <Form.Select
                      value={fitnessGoal}
                      onChange={(e) => setFitnessGoal(e.target.value)}
                      style={formControlStyle}
                    >
                      <option value=''>Select a goal</option>
                      <option value='gain weight'>Gain Weight</option>
                      <option value='lose weight'>Lose Weight</option>
                      <option value='build muscle'>Build Muscle</option>
                      <option value='get lean'>Get Lean</option>
                      <option value='maintain'>Maintain</option>
                      <option value='other'>Other</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className='mb-4' controlId='injuries'>
                    <Form.Label style={{ fontWeight: '600' }}>
                      <FaMedkit
                        className='me-2'
                        style={{ color: accentColor }}
                      />
                      Injuries/Limitations
                    </Form.Label>
                    <Form.Control
                      as='textarea'
                      rows={3}
                      placeholder='Any injuries or physical limitations?'
                      value={injuries}
                      onChange={(e) => setInjuries(e.target.value)}
                      style={{
                        ...formControlStyle,
                        minHeight: '100px',
                      }}
                    />
                  </Form.Group>

                  <Form.Group className='mb-4'>
                    <Form.Label
                      htmlFor='additionalInfo'
                      style={{ fontWeight: '600' }}
                    >
                      <FaInfoCircle
                        className='me-2'
                        style={{ color: accentColor }}
                      />
                      Additional Information
                      <br />
                      <small
                        style={{
                          color: isDarkMode ? '#aaa' : '#666',
                          paddingLeft: '20px',
                        }}
                      >
                        Admin can leave a message here for you
                      </small>
                    </Form.Label>
                    <Form.Control
                      as='textarea'
                      rows={3}
                      id='additionalInfo'
                      placeholder='Admin messages will appear here'
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      readOnly={!userInfo?.isAdmin}
                      style={{
                        ...formControlStyle,
                        resize: 'vertical',
                        minHeight: '100px',
                      }}
                    />
                  </Form.Group>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Collections Section */}
          <Col xs={12}>
            <Card style={{ ...cardStyle, marginBottom: '12px' }}>
              <Card.Body className='p-2'>
                <div className='d-flex justify-content-between align-items-center mb-2'>
                  <h3
                    style={{
                      color: isDarkMode ? '#f0f0f0' : '#333',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      margin: 0,
                    }}
                  >
                    <FaLayerGroup className='me-2' style={{ color: accentColor, fontSize: '0.9rem' }} />
                    Your Assigned Collections
                  </h3>
                  <Button
                    variant='link'
                    onClick={handleShowAssigned}
                    style={{
                      ...toggleButtonStyle,
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                    }}
                  >
                    {showAssigned ? (
                      <>
                        <FaChevronUp size={8} />
                        <span className='d-none d-sm-inline ms-1'>Hide</span>
                      </>
                    ) : (
                      <>
                        <FaChevronDown size={8} />
                        <span className='d-none d-sm-inline ms-1'>Show</span>
                      </>
                    )}
                  </Button>
                </div>
                {showAssigned && renderAssignedCollections()}
              </Card.Body>
            </Card>
          </Col>

          {/* Collections Accessed with Code */}
          <Col xs={12}>
            <Card style={{ ...cardStyle }}>
              <Card.Body className='p-2'>
                <div className='d-flex justify-content-between align-items-center mb-2'>
                  <h3
                    style={{
                      color: isDarkMode ? '#f0f0f0' : '#333',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      margin: 0,
                    }}
                  >
                    <FaUnlock className='me-2' style={{ color: accentColor, fontSize: '0.9rem' }} />
                    Collections Accessed
                  </h3>
                  <Button
                    variant='link'
                    onClick={handleShowAccessed}
                    style={{
                      ...toggleButtonStyle,
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                    }}
                  >
                    {showAccessed ? (
                      <>
                        <FaChevronUp size={8} />
                        <span className='d-none d-sm-inline ms-1'>Hide</span>
                      </>
                    ) : (
                      <>
                        <FaChevronDown size={8} />
                        <span className='d-none d-sm-inline ms-1'>Show</span>
                      </>
                    )}
                  </Button>
                </div>
                {showAccessed && (
                  userInfo?.accessedCollections?.filter(c => c.accessedWithCode)?.length > 0 ? (
                    <>
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: isDarkMode ? '#aaa' : '#666',
                          margin: '0 0 8px 0',
                        }}
                      >
                        {userInfo.accessedCollections.filter(c => c.accessedWithCode).length} Collection(s)
                      </p>
                      <Row className='g-2'>
                        {userInfo.accessedCollections
                          .filter(collection => collection.accessedWithCode)
                          .map(collection => renderCollectionCard(collection))}
                      </Row>
                    </>
                  ) : (
                    <p style={{ 
                      color: isDarkMode ? '#aaa' : '#666',
                      fontSize: '0.75rem',
                      margin: 0 
                    }}>
                      No collections accessed with code.
                    </p>
                  )
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Add Progress Images Section */}
      <Row className='mt-3'>
        <Col>
         
          <ProgressImageSection />
        </Col>
      </Row>
    </AnimatedScreenWrapper>
  );
};

export default ProfileScreen;
