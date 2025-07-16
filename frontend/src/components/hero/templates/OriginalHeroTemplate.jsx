import React, { memo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import {
  FaDumbbell,
  FaFire,
  FaBolt,
  FaAngleRight,
  FaHeartbeat,
  FaTrophy,
  FaLayerGroup,
  FaMedal,
} from 'react-icons/fa';

// Copy the exact styles and logic from the original HeroSection
const OriginalHeroTemplate = memo(({ templateData, userInfo }) => {
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );

  const [animationsEnabled, setAnimationsEnabled] = useState(false);
  const [motivationalQuote, setMotivationalQuote] = useState('');
  const heroSectionRef = useRef(null);

  // Theme observer
  useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(
        document.documentElement.getAttribute('data-theme') === 'dark'
      );
    };

    const interval = setInterval(checkTheme, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize animations and quote
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationsEnabled(true);
      setMotivationalQuote(
        "Fitness is not about being better than someone else. It's about being better than you used to be."
      );
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  if (!templateData || !templateData.content) {
    return null;
  }

  const { content } = templateData;

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Customize content based on user info
  const dynamicTitle = userInfo
    ? `${getGreeting()}, ${userInfo.name?.split(' ')[0] || 'Admin'}!`
    : content.title;

  const dynamicSubtitle = userInfo
    ? `Ready to crush your fitness goals today? Your personalized training and nutrition plan is waiting for you.`
    : content.subtitle;

  const themeColors = {
    primary: '#4F46E5',
    secondary: '#10B981',
    accent: '#EC4899',
    tertiary: '#7C3AED',
  };

  // Exact styles from the original HeroSection
  const premiumHeroStyles = {
    container: {
      position: 'relative',
      padding: '0',
      margin: '0rem 0 2rem 0',
      borderRadius: '20px',
      overflow: 'hidden',
      minHeight: 'auto',
      height: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: isDarkMode
        ? '0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 20px rgba(0, 0, 0, 0.4)'
        : '0 20px 40px rgba(79, 70, 229, 0.08), 0 10px 20px rgba(79, 70, 229, 0.05)',
      background: isDarkMode
        ? `linear-gradient(135deg, #000000 0%, #0F0F0F 100%)`
        : `linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)`,
      transform: 'translateZ(0)',
      willChange: 'transform, opacity',
    },
    backgroundOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      opacity: isDarkMode ? 0.4 : 0.6,
      zIndex: 0,
    },
    gradientOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: isDarkMode
        ? `linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(15, 15, 15, 0.9) 50%, rgba(0, 0, 0, 0.95) 100%)`
        : `linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 50%, rgba(255, 255, 255, 0.98) 100%)`,
      zIndex: 1,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    },
    contentWrapper: {
      width: '100%',
      maxWidth: '1200px',
      position: 'relative',
      zIndex: 2,
      display: 'flex',
      padding: '0 0.2rem',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
    },
    textContent: {
      flex: '1 1 550px',
      padding: '1.5rem 1rem',
    },
    visualContent: {
      flex: '1 1 450px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '1rem',
      position: 'relative',
      minHeight: '320px',
    },
    title: {
      fontSize: 'clamp(1.8rem, 4vw, 3.2rem)',
      fontWeight: '800',
      marginBottom: '1.2rem',
      lineHeight: '1.1',
      background: isDarkMode
        ? `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.tertiary} 50%, ${themeColors.accent} 100%)`
        : `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.tertiary} 100%)`,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      letterSpacing: '-0.02em',
      textShadow: isDarkMode
        ? '0 2px 10px rgba(79, 70, 229, 0.3)'
        : '0 2px 4px rgba(79, 70, 229, 0.1)',
    },
    subtitle: {
      fontSize: 'clamp(0.95rem, 1.8vw, 1.2rem)',
      color: isDarkMode ? '#E2E8F0' : '#4A5568',
      fontWeight: '500',
      marginBottom: '1.8rem',
      maxWidth: '520px',
      lineHeight: '1.6',
    },
    motivationalQuote: {
      fontSize: 'clamp(0.85rem, 1.4vw, 1.05rem)',
      fontWeight: '600',
      fontStyle: 'italic',
      padding: '1rem 1.4rem',
      marginBottom: '1.5rem',
      borderRadius: '12px',
      background: isDarkMode
        ? `rgba(79, 70, 229, 0.1)`
        : `rgba(79, 70, 229, 0.05)`,
      color: isDarkMode ? '#a5b4fc' : '#4F46E5',
      animation: 'fadeIn 1s ease-out, pulse 3s infinite',
      transition: 'all 0.5s ease',
      display: 'flex',
      alignItems: 'center',
      boxShadow: isDarkMode
        ? '0 4px 12px rgba(0, 0, 0, 0.3)'
        : '0 4px 15px rgba(79, 70, 229, 0.08)',
      border: isDarkMode
        ? '1px solid rgba(79, 70, 229, 0.2)'
        : '1px solid rgba(79, 70, 229, 0.1)',
      position: 'relative',
      overflow: 'hidden',
    },
    statsList: {
      display: 'flex',
      gap: '0.8rem',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
    },
    statItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      position: 'relative',
      padding: '1rem 0.8rem',
      borderRadius: '12px',
      background: isDarkMode
        ? `linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)`
        : `linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)`,
      backdropFilter: 'blur(10px)',
      border: isDarkMode
        ? '1px solid rgba(255, 255, 255, 0.1)'
        : '1px solid rgba(79, 70, 229, 0.1)',
      minWidth: '90px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: isDarkMode
        ? '0 4px 16px rgba(0, 0, 0, 0.1)'
        : '0 4px 16px rgba(79, 70, 229, 0.1)',
      animation: animationsEnabled
        ? 'slideInRight 0.6s ease-out forwards'
        : 'none',
      opacity: 0,
      transform: 'translateY(0) scale(1)',
    },
    statValue: {
      fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)',
      fontWeight: '800',
      color: themeColors.primary,
      marginBottom: '0.3rem',
      lineHeight: '1',
    },
    statLabel: {
      fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)',
      color: isDarkMode ? '#94a3b8' : '#64748b',
      fontWeight: '600',
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
    },
    badge: {
      position: 'absolute',
      top: '5%',
      left: '5%',
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
      color: 'white',
      fontWeight: '600',
      fontSize: '0.8rem',
      boxShadow: `0 3px 10px rgba(${parseInt(
        themeColors.primary.slice(1, 3),
        16
      )}, ${parseInt(themeColors.primary.slice(3, 5), 16)}, ${parseInt(
        themeColors.primary.slice(5, 7),
        16
      )}, 0.4)`,
      animation: 'pulse 2s infinite',
    },
    newTag: {
      display: 'inline-block',
      padding: '0.25rem 0.6rem',
      borderRadius: '16px',
      background: themeColors.secondary,
      color: 'white',
      fontSize: '0.7rem',
      fontWeight: '700',
      marginLeft: '0.6rem',
      boxShadow: `0 3px 6px rgba(${parseInt(
        themeColors.secondary.slice(1, 3),
        16
      )}, ${parseInt(themeColors.secondary.slice(3, 5), 16)}, ${parseInt(
        themeColors.secondary.slice(5, 7),
        16
      )}, 0.3)`,
    },
    feature: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '0.8rem',
      padding: '0.6rem 0',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      borderRadius: '8px',
    },
    featureIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.tertiary} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      marginRight: '1rem',
      transition: 'all 0.3s ease',
      boxShadow: `0 4px 15px rgba(79, 70, 229, 0.3)`,
    },
    featureText: {
      fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)',
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : '#1A202C',
      display: 'flex',
      alignItems: 'center',
    },
    actionButtons: {
      display: 'flex',
      gap: '1rem',
      marginTop: '2rem',
      flexWrap: 'wrap',
    },
    primaryButton: {
      background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.tertiary} 100%)`,
      border: 'none',
      borderRadius: '50px',
      color: 'white',
      fontWeight: '600',
      fontSize: 'clamp(0.9rem, 1.4vw, 1.05rem)',
      padding: 'clamp(0.8rem, 1.5vw, 1rem) clamp(1.8rem, 3vw, 2.2rem)',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      textDecoration: 'none',
      boxShadow: `0 8px 25px rgba(79, 70, 229, 0.3)`,
      position: 'relative',
      overflow: 'hidden',
    },
    tertiaryButton: {
      background: 'transparent',
      border: `2px solid ${themeColors.primary}`,
      borderRadius: '50px',
      color: themeColors.primary,
      fontWeight: '600',
      fontSize: 'clamp(0.9rem, 1.4vw, 1.05rem)',
      padding: 'clamp(0.6rem, 1.3vw, 0.8rem) clamp(1.6rem, 2.8vw, 2rem)',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      textDecoration: 'none',
      backdropFilter: 'blur(10px)',
    },
    achievementBadge: {
      position: 'absolute',
      top: '5%',
      left: '5%',
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      background: `linear-gradient(135deg, ${themeColors.secondary} 0%, ${themeColors.accent} 100%)`,
      color: 'white',
      fontWeight: '600',
      fontSize: '0.8rem',
      boxShadow: `0 6px 20px rgba(16, 185, 129, 0.4)`,
      display: 'flex',
      alignItems: 'center',
      zIndex: 3,
      animation: 'pulse 2s infinite',
    },
    statsCircle: {
      position: 'relative',
      width: '180px',
      height: '180px',
      margin: '0 auto',
    },
    progressRing: {
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      background: `conic-gradient(from 0deg, ${themeColors.primary} 0deg, ${themeColors.primary} 270deg, transparent 270deg, transparent 360deg)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    progressInner: {
      position: 'relative',
      zIndex: 2,
      textAlign: 'center',
      width: '140px',
      height: '140px',
      borderRadius: '50%',
      background: isDarkMode ? '#111111' : '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressValue: {
      fontSize: '2rem',
      fontWeight: '800',
      color: themeColors.primary,
      display: 'block',
      marginBottom: '0.5rem',
    },
    progressLabel: {
      fontSize: '0.9rem',
      color: isDarkMode ? '#94a3b8' : '#64748b',
      fontWeight: '600',
    },
    floatingCard: {
      position: 'absolute',
      padding: '0.8rem 1rem',
      borderRadius: '12px',
      background: isDarkMode
        ? `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)`
        : `linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)`,
      backdropFilter: 'blur(15px)',
      border: isDarkMode
        ? '1px solid rgba(255, 255, 255, 0.1)'
        : '1px solid rgba(79, 70, 229, 0.1)',
      boxShadow: isDarkMode
        ? '0 8px 25px rgba(0, 0, 0, 0.3)'
        : '0 8px 25px rgba(79, 70, 229, 0.1)',
      minWidth: '100px',
      textAlign: 'center',
    },
    card1: {
      top: '20%',
      right: '10%',
    },
    card2: {
      bottom: '25%',
      left: '15%',
    },
    cardIcon: {
      color: themeColors.primary,
      marginBottom: '0.3rem',
      fontSize: '1.2rem',
    },
    cardTitle: {
      fontSize: '0.75rem',
      color: isDarkMode ? '#94a3b8' : '#64748b',
      fontWeight: '600',
      marginBottom: '0.2rem',
    },
    cardValue: {
      fontSize: '0.9rem',
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#1a202c',
    },
  };

  const scrollToNextSection = () => {
    const nextSection = document.querySelector(
      '.collections-grid, .assigned-collections'
    );
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Quote icon component
  const FaQuote = ({ style }) => {
    return (
      <div style={style}>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 24 24'
          fill='currentColor'
          width='24'
          height='24'
        >
          <path d='M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z' />
        </svg>
      </div>
    );
  };

  return (
    <div
      style={{
        ...premiumHeroStyles.container,
        transform: animationsEnabled ? 'translateY(0)' : 'translateY(20px)',
        opacity: animationsEnabled ? 1 : 0,
      }}
      ref={heroSectionRef}
      className='hero-section'
    >
      {/* Enhanced background with overlay effect */}
      <div
        style={{
          ...premiumHeroStyles.backgroundOverlay,
          backgroundImage: `url('${content.backgroundImage}')`,
          opacity: 0.75,
          filter: isDarkMode
            ? 'brightness(0.7) contrast(1.2)'
            : 'brightness(1.05) contrast(1.05)',
          transition: 'all 0.5s ease',
        }}
      />
      <div style={premiumHeroStyles.gradientOverlay}></div>

      {/* Content wrapper */}
      <div style={premiumHeroStyles.contentWrapper}>
        {/* Text content */}
        <div style={premiumHeroStyles.textContent}>
          <h1
            style={{
              ...premiumHeroStyles.title,
              transform: animationsEnabled
                ? 'translateY(0)'
                : 'translateY(20px)',
              opacity: animationsEnabled ? 1 : 0,
              transition: 'all 0.8s cubic-bezier(0.2, 1, 0.3, 1)',
            }}
          >
            {dynamicTitle}
          </h1>

          <p
            style={{
              ...premiumHeroStyles.subtitle,
              transform: animationsEnabled
                ? 'translateY(0)'
                : 'translateY(20px)',
              opacity: animationsEnabled ? 1 : 0,
              transition: 'all 0.8s cubic-bezier(0.2, 1, 0.3, 1) 0.1s',
            }}
          >
            {dynamicSubtitle}
          </p>

          {/* Enhanced Motivational Quote */}
          <div style={premiumHeroStyles.motivationalQuote}>
            <FaQuote
              style={{
                color: themeColors.tertiary,
                marginRight: '0.8rem',
                width: '20px',
                height: '20px',
                transition: 'all 0.3s ease',
              }}
            />
            <span>{motivationalQuote}</span>
          </div>

          {userInfo && (
            <div style={premiumHeroStyles.statsList}>
              <div
                style={{
                  ...premiumHeroStyles.statItem,
                  animation: animationsEnabled
                    ? 'slideInRight 0.6s ease-out forwards'
                    : 'none',
                  opacity: 0,
                  transition: 'all 0.3s ease',
                  transform: 'translateY(0) scale(1)',
                }}
              >
                <span style={premiumHeroStyles.statValue}>75%</span>
                <span style={premiumHeroStyles.statLabel}>Weekly Goal</span>
                <div style={premiumHeroStyles.badge}>
                  <FaFire size={14} />
                </div>
              </div>

              <div
                style={{
                  ...premiumHeroStyles.statItem,
                  animation: animationsEnabled
                    ? 'slideInRight 0.6s 0.1s ease-out forwards'
                    : 'none',
                  opacity: 0,
                }}
              >
                <span style={premiumHeroStyles.statValue}>4</span>
                <span style={premiumHeroStyles.statLabel}>Day Streak</span>
                <div style={premiumHeroStyles.badge}>
                  <FaBolt size={14} />
                </div>
              </div>

              <div
                style={{
                  ...premiumHeroStyles.statItem,
                  animation: animationsEnabled
                    ? 'slideInRight 0.6s 0.2s ease-out forwards'
                    : 'none',
                  opacity: 0,
                }}
              >
                <span style={premiumHeroStyles.statValue}>100%</span>
                <span style={premiumHeroStyles.statLabel}>Gains</span>
                <div style={premiumHeroStyles.badge}>
                  <FaMedal size={14} />
                </div>
              </div>
            </div>
          )}

          <div
            style={premiumHeroStyles.feature}
            className='feature-item'
            onMouseEnter={(e) => {
              if (e.currentTarget.querySelector('.feature-icon')) {
                e.currentTarget.querySelector('.feature-icon').style.transform =
                  'translateY(-3px) rotate(5deg)';
              }
            }}
            onMouseLeave={(e) => {
              if (e.currentTarget.querySelector('.feature-icon')) {
                e.currentTarget.querySelector('.feature-icon').style.transform =
                  'translateY(0) rotate(0deg)';
              }
            }}
          >
            <div style={premiumHeroStyles.featureIcon} className='feature-icon'>
              <FaDumbbell size={22} />
            </div>
            <span style={premiumHeroStyles.featureText}>
              Science-backed workout plans tailored to your goals
              {!userInfo && <span style={premiumHeroStyles.newTag}>NEW</span>}
            </span>
          </div>

          <div
            style={premiumHeroStyles.feature}
            className='feature-item'
            onMouseEnter={(e) => {
              if (e.currentTarget.querySelector('.feature-icon')) {
                e.currentTarget.querySelector('.feature-icon').style.transform =
                  'translateY(-3px) rotate(5deg)';
              }
            }}
            onMouseLeave={(e) => {
              if (e.currentTarget.querySelector('.feature-icon')) {
                e.currentTarget.querySelector('.feature-icon').style.transform =
                  'translateY(0) rotate(0deg)';
              }
            }}
          >
            <div style={premiumHeroStyles.featureIcon} className='feature-icon'>
              <FaHeartbeat size={22} />
            </div>
            <span style={premiumHeroStyles.featureText}>
              Real-time progress monitoring with AI insights
            </span>
          </div>

          <div
            style={premiumHeroStyles.feature}
            className='feature-item'
            onMouseEnter={(e) => {
              if (e.currentTarget.querySelector('.feature-icon')) {
                e.currentTarget.querySelector('.feature-icon').style.transform =
                  'translateY(-3px) rotate(5deg)';
              }
            }}
            onMouseLeave={(e) => {
              if (e.currentTarget.querySelector('.feature-icon')) {
                e.currentTarget.querySelector('.feature-icon').style.transform =
                  'translateY(0) rotate(0deg)';
              }
            }}
          >
            <div style={premiumHeroStyles.featureIcon} className='feature-icon'>
              <FaLayerGroup size={22} />
            </div>
            <span style={premiumHeroStyles.featureText}>
              Premium equipment collections & guides
            </span>
          </div>

          <div
            style={premiumHeroStyles.actionButtons}
            className='action-buttons'
          >
            <Button
              onClick={scrollToNextSection}
              to={userInfo ? '/workout' : '/register'}
              style={premiumHeroStyles.primaryButton}
              className='primary-button'
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = isDarkMode
                  ? `0 15px 35px rgba(139, 92, 246, 0.4)`
                  : `0 15px 35px rgba(139, 92, 246, 0.3)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              {userInfo ? 'Start Workout' : 'Join Now'}
              <FaAngleRight />
            </Button>

            <Button
              as={Link}
              to='/workout-dashboard'
              style={premiumHeroStyles.tertiaryButton}
              className='tertiary-button'
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = isDarkMode
                  ? `0 10px 25px rgba(139, 92, 246, 0.25)`
                  : `0 10px 25px rgba(139, 92, 246, 0.2)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              Dashboard
            </Button>
          </div>
        </div>

        {/* Visual content */}
        <div style={premiumHeroStyles.visualContent} className='visual-content'>
          {userInfo && (
            <div
              style={{
                ...premiumHeroStyles.achievementBadge,
                animation: 'pulse 2s infinite',
              }}
              className='achievement-badge'
            >
              <FaTrophy size={14} style={{ marginRight: '4px' }} />
              <span>Non-Stop Achiever</span>
            </div>
          )}

          <div style={premiumHeroStyles.statsCircle} className='stats-circle'>
            <div style={premiumHeroStyles.progressRing}>
              <div style={premiumHeroStyles.progressInner}>
                <span style={premiumHeroStyles.progressValue}>75%</span>
                <span style={premiumHeroStyles.progressLabel}>
                  Almost there!
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              ...premiumHeroStyles.floatingCard,
              ...premiumHeroStyles.card1,
              animation: 'float 6s ease-in-out infinite',
            }}
            className='floating-card card1'
          >
            <div style={premiumHeroStyles.cardIcon}>
              <FaBolt />
            </div>
            <div style={premiumHeroStyles.cardTitle}>Today's Workout</div>
            <div style={premiumHeroStyles.cardValue}>Ready</div>
          </div>

          <div
            style={{
              ...premiumHeroStyles.floatingCard,
              ...premiumHeroStyles.card2,
              animation: 'float 5s 1s ease-in-out infinite',
            }}
            className='floating-card card2'
          >
            <div style={premiumHeroStyles.cardIcon}>
              <FaFire />
            </div>
            <div style={premiumHeroStyles.cardTitle}>Train Hard,</div>
            <div style={premiumHeroStyles.cardValue}>Stay Strong</div>
          </div>
        </div>
      </div>
    </div>
  );
});

OriginalHeroTemplate.displayName = 'OriginalHeroTemplate';

export default OriginalHeroTemplate;
