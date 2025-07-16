import React, { memo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FaDumbbell,
    FaFire,
    FaBolt,
    FaAngleRight,
    FaHeartbeat,
    FaTrophy,
    FaLayerGroup,
    FaMedal,
    FaStar,
    FaRocket,
    FaBullseye
} from 'react-icons/fa';

const CustomHeroTemplate = memo(({ templateData, userInfo }) => {
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );

    // Theme observer
    useEffect(() => {
        const checkTheme = () => {
            setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
        };
        
        const interval = setInterval(checkTheme, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!templateData || !templateData.content) {
        return <div>Loading Custom Hero...</div>;
    }

    const { content } = templateData;

    // Icon mapping for dynamic icons
    const iconMap = {
        fire: FaFire,
        bolt: FaBolt,
        trophy: FaTrophy,
        medal: FaMedal,
        star: FaStar,
        rocket: FaRocket,
        bullseye: FaBullseye,
        dumbbell: FaDumbbell,
        heartbeat: FaHeartbeat,
        layer: FaLayerGroup
    };

    const themeColors = {
        primary: '#4F46E5',
        secondary: '#10B981',
        accent: '#EC4899',
        tertiary: '#7C3AED',
    };

    // Extract content with clear fallbacks
    const displayTitle = content.title || 'Default Custom Title';
    const displaySubtitle = content.subtitle || 'Default custom subtitle';
    const primaryButton = content.primaryButton || { text: 'Primary', link: '/workout' };
    const secondaryButton = content.secondaryButton || { text: 'Secondary', link: '/about' };
    const stats = content.stats || [];

    // Modern hero styles
    const heroStyles = {
        container: {
            position: 'relative',
            padding: '3rem 1rem',
            margin: '0rem 0 2rem 0',
            borderRadius: '24px',
            overflow: 'hidden',
            minHeight: '500px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isDarkMode
                ? '0 25px 50px rgba(0, 0, 0, 0.8), 0 15px 30px rgba(0, 0, 0, 0.6)'
                : '0 25px 50px rgba(79, 70, 229, 0.15), 0 15px 30px rgba(79, 70, 229, 0.08)',
            background: isDarkMode
                ? `linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)`
                : `linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%)`
        },
        contentWrapper: {
            width: '100%',
            maxWidth: '1200px',
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            padding: '0 1rem',
        },
        title: {
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: '900',
            marginBottom: '1.5rem',
            lineHeight: '1.1',
            background: isDarkMode
                ? `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.tertiary} 30%, ${themeColors.accent} 60%, ${themeColors.secondary} 100%)`
                : `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.tertiary} 50%, ${themeColors.accent} 100%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em',
        },
        subtitle: {
            fontSize: 'clamp(1.1rem, 2.2vw, 1.4rem)',
            color: isDarkMode ? '#E2E8F0' : '#4A5568',
            fontWeight: '500',
            marginBottom: '2.5rem',
            maxWidth: '600px',
            margin: '0 auto 2.5rem auto',
            lineHeight: '1.7',
        },
        buttonContainer: {
            display: 'flex',
            gap: '1.5rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '2rem',
        },
        primaryButton: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.8rem',
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            fontWeight: '700',
            color: '#ffffff',
            background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.tertiary} 100%)`,
            border: 'none',
            borderRadius: '12px',
            textDecoration: 'none',
            transition: 'all 0.3s ease',
        },
        secondaryButton: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.8rem',
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            color: isDarkMode ? '#ffffff' : themeColors.primary,
            background: isDarkMode
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(79, 70, 229, 0.1)',
            border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(79, 70, 229, 0.2)'}`,
            borderRadius: '12px',
            textDecoration: 'none',
            transition: 'all 0.3s ease',
        }
    };

    return (
        <div style={heroStyles.container}>
            {/* Background Image */}
            {content.backgroundImage && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url('${content.backgroundImage}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: isDarkMode ? 0.3 : 0.5,
                    zIndex: 0,
                }} />
            )}
            
            {/* Gradient Overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: isDarkMode
                    ? `linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(26, 26, 26, 0.9) 50%, rgba(10, 10, 10, 0.95) 100%)`
                    : `linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 50%, rgba(255, 255, 255, 0.98) 100%)`,
                zIndex: 1,
            }}></div>

            {/* Content */}
            <div style={heroStyles.contentWrapper}>
                {/* Title */}
                <h1 style={heroStyles.title}>
                    {displayTitle}
                </h1>

                {/* Subtitle */}
                <p style={heroStyles.subtitle}>
                    {displaySubtitle}
                </p>

                {/* Stats */}
                {stats && stats.length > 0 && (
                    <div style={{
                        display: 'flex',
                        gap: '1.5rem',
                        marginBottom: '3rem',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                    }}>
                        {stats.map((stat, index) => {
                            const IconComponent = iconMap[stat?.icon] || FaTrophy;
                            return (
                                <div key={index} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    padding: '1.5rem 1.2rem',
                                    borderRadius: '16px',
                                    background: isDarkMode
                                        ? `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)`
                                        : `linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)`,
                                    minWidth: '120px',
                                }}>
                                    <div style={{
                                        fontSize: '1.8rem',
                                        color: themeColors.primary,
                                        marginBottom: '0.8rem',
                                    }}>
                                        <IconComponent />
                                    </div>
                                    <div style={{
                                        fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                                        fontWeight: '800',
                                        color: isDarkMode ? '#ffffff' : '#1a202c',
                                        marginBottom: '0.5rem',
                                    }}>
                                        {stat?.value || '0'}
                                    </div>
                                    <div style={{
                                        fontSize: '0.9rem',
                                        color: isDarkMode ? '#94a3b8' : '#64748b',
                                        fontWeight: '600',
                                        textAlign: 'center',
                                    }}>
                                        {stat?.label || 'Stat'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Action Buttons */}
                <div style={heroStyles.buttonContainer}>
                    <Link
                        to={primaryButton.link || '/workout'}
                        style={heroStyles.primaryButton}
                    >
                        {primaryButton.text || 'Get Started'}
                        <FaAngleRight />
                    </Link>

                    <Link
                        to={secondaryButton.link || '/about'}
                        style={heroStyles.secondaryButton}
                    >
                        {secondaryButton.text || 'Learn More'}
                    </Link>
                </div>
            </div>
        </div>
    );
});

CustomHeroTemplate.displayName = 'CustomHeroTemplate';

export default CustomHeroTemplate; 