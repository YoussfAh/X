import React, { memo, useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

const themeColors = {
    primary: '#4F46E5',
    secondary: '#7C3AED',
    tertiary: '#10B981',
    accent: '#F59E0B'
};

const getThemeAwareStyles = (isDarkMode) => ({
    container: {
        position: 'relative',
        padding: '0',
        margin: '0rem 0 2rem 0',
        borderRadius: '20px',
        overflow: 'hidden',
        minHeight: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isDarkMode
            ? '0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 20px rgba(0, 0, 0, 0.4)'
            : '0 20px 40px rgba(79, 70, 229, 0.08), 0 10px 20px rgba(79, 70, 229, 0.05)',
        background: isDarkMode
            ? 'linear-gradient(135deg, #000000 0%, #0F0F0F 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        transform: 'translateZ(0)', // GPU acceleration
        willChange: 'transform, opacity'
    },
    backgroundOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: isDarkMode ? 0.3 : 0.2,
        zIndex: 0
    },
    gradientOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isDarkMode
            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(15, 15, 15, 0.9) 50%, rgba(0, 0, 0, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 50%, rgba(255, 255, 255, 0.98) 100%)',
        zIndex: 1,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
    },
    contentWrapper: {
        width: '100%',
        maxWidth: '1200px',
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        padding: '0 1rem',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap'
    },
    textContent: {
        flex: '1 1 550px',
        padding: '2rem 1rem'
    },
    title: {
        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
        fontWeight: '800',
        marginBottom: '1.5rem',
        lineHeight: '1.1',
        background: isDarkMode
            ? `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.tertiary} 50%, ${themeColors.accent} 100%)`
            : `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.tertiary} 100%)`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-0.02em'
    },
    subtitle: {
        fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
        lineHeight: '1.7',
        marginBottom: '2rem',
        color: isDarkMode ? '#e2e8f0' : '#475569',
        fontWeight: '400'
    },
    button: {
        background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
        color: 'white',
        border: 'none',
        padding: '1rem 2.5rem',
        borderRadius: '50px',
        fontSize: '1.1rem',
        fontWeight: '600',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'inline-block',
        transition: 'all 0.3s ease',
        boxShadow: `0 8px 25px rgba(79, 70, 229, 0.3)`,
        transform: 'translateY(0)',
        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 12px 35px rgba(79, 70, 229, 0.4)`
        }
    },
    statsSection: {
        marginTop: '3rem',
        display: 'flex',
        gap: '2rem',
        flexWrap: 'wrap'
    },
    statItem: {
        textAlign: 'center',
        padding: '1.5rem',
        background: isDarkMode
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(255, 255, 255, 0.8)',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)',
        border: isDarkMode
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(79, 70, 229, 0.1)',
        minWidth: '120px'
    },
    statValue: {
        fontSize: '2rem',
        fontWeight: '800',
        color: themeColors.primary,
        display: 'block',
        marginBottom: '0.5rem'
    },
    statLabel: {
        fontSize: '0.9rem',
        color: isDarkMode ? '#94a3b8' : '#64748b',
        fontWeight: '500'
    }
});

// Icon components for stats
const IconComponents = {
    users: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
        </svg>
    ),
    dumbbell: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
        </svg>
    ),
    trophy: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20.5C20.78 4 21 4.22 21 4.5C21 4.78 20.78 5 20.5 5H20V8C20 10.21 18.21 12 16 12H15.5V16H17C17.55 16 18 16.45 18 17C18 17.55 17.55 18 17 18H7C6.45 18 6 17.55 6 17C6 16.45 6.45 16 7 16H8.5V12H8C5.79 12 4 10.21 4 8V5H3.5C3.22 5 3 4.78 3 4.5C3 4.22 3.22 4 3.5 4H7Z"/>
        </svg>
    )
};

const ClassicHeroTemplate = memo(({ templateData, userInfo }) => {
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );
    
    const [animationsEnabled, setAnimationsEnabled] = useState(false);

    // Get theme-aware styles
    const styles = useMemo(() => getThemeAwareStyles(isDarkMode), [isDarkMode]);

    // Theme observer
    useEffect(() => {
        const checkTheme = () => {
            setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
        };
        
        const interval = setInterval(checkTheme, 1000);
        return () => clearInterval(interval);
    }, []);

    // Enable animations after mount
    useEffect(() => {
        const timer = setTimeout(() => setAnimationsEnabled(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (!templateData || !templateData.content) {
        return null;
    }

    const { content } = templateData;

    // Customize content based on user info
    const dynamicTitle = userInfo 
        ? `Welcome back, ${userInfo.name.split(' ')[0]}!`
        : content.title;

    const dynamicSubtitle = userInfo
        ? `Ready to continue your fitness journey? Your personalized training awaits.`
        : content.subtitle;

    return (
        <div style={{
            ...styles.container,
            opacity: animationsEnabled ? 1 : 0,
            transform: animationsEnabled ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s cubic-bezier(0.2, 1, 0.3, 1)'
        }}>
            {/* Background Image */}
            {content.backgroundImage && (
                <div 
                    style={{
                        ...styles.backgroundOverlay,
                        backgroundImage: `url(${content.backgroundImage})`
                    }}
                />
            )}
            
            {/* Gradient Overlay */}
            <div style={styles.gradientOverlay} />
            
            {/* Content */}
            <div style={styles.contentWrapper}>
                <div style={styles.textContent}>
                    <h1 style={styles.title}>
                        {dynamicTitle}
                    </h1>
                    
                    <p style={styles.subtitle}>
                        {dynamicSubtitle}
                    </p>
                    
                    <Link 
                        to={content.buttonLink}
                        style={styles.button}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 12px 35px rgba(79, 70, 229, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 8px 25px rgba(79, 70, 229, 0.3)';
                        }}
                    >
                        {content.buttonText}
                    </Link>
                    
                    {/* Stats Section */}
                    {content.showStats && content.stats && content.stats.length > 0 && (
                        <div style={styles.statsSection}>
                            {content.stats.map((stat, index) => {
                                const IconComponent = IconComponents[stat.icon] || IconComponents.trophy;
                                return (
                                    <div key={index} style={styles.statItem}>
                                        <div style={{ 
                                            color: themeColors.primary, 
                                            marginBottom: '0.5rem',
                                            display: 'flex',
                                            justifyContent: 'center'
                                        }}>
                                            <IconComponent />
                                        </div>
                                        <span style={styles.statValue}>{stat.value}</span>
                                        <span style={styles.statLabel}>{stat.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

ClassicHeroTemplate.displayName = 'ClassicHeroTemplate';

export default ClassicHeroTemplate; 