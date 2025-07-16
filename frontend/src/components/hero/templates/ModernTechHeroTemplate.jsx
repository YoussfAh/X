import React, { memo, useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaDumbbell, FaUsers, FaTasks, FaUserTie } from 'react-icons/fa';

const ModernTechHeroTemplate = memo(({ templateData, userInfo, forceRefreshKey }) => {
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    const styles = useMemo(() => ({
        container: {
            position: 'relative',
            minHeight: '70vh',
            padding: '0 2rem 4rem 2rem',
            margin: '2rem 0 2rem 0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            background: '#000000',
            color: '#ffffff',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 80px 40px #000',
        },
        backgroundGlow: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '1200px',
            height: '1200px',
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, rgba(124, 58, 237, 0) 60%)',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
        },
        contentWrapper: {
            position: 'relative',
            zIndex: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        },
        topText: {
            display: 'inline-block',
            padding: '0.5rem 1rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '50px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            color: '#e5e7eb',
            backdropFilter: 'blur(5px)',
        },
        title: {
            fontSize: 'clamp(3rem, 6vw, 5.5rem)',
            fontWeight: 'bold',
            lineHeight: 1.1,
            marginBottom: '1rem',
            maxWidth: '1000px',
        },
        subtitle: {
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            marginBottom: '2.5rem',
            maxWidth: '600px',
            color: '#d1d5db',
            opacity: 0.9,
        },
        buttonContainer: {
            display: 'flex',
            gap: '1rem',
        },
        primaryButton: {
            padding: '1rem 2rem',
            fontSize: '1rem',
            fontWeight: '600',
            borderRadius: '50px',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.9)',
            color: '#1f2937',
            textDecoration: 'none',
            transition: 'transform 0.2s ease',
            cursor: 'pointer',
        },
        secondaryButton: {
            padding: '1rem 2rem',
            fontSize: '1rem',
            fontWeight: '600',
            borderRadius: '50px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            background: 'transparent',
            color: '#f9fafb',
            textDecoration: 'none',
            transition: 'background-color 0.2s ease',
            cursor: 'pointer',
        },
        statContainer: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 2,
        },
        statItem: {
            position: 'absolute',
            color: '#e5e7eb',
            textAlign: 'left',
            animation: 'float 6s ease-in-out infinite',
        },
    }), [isDarkMode]);
    
    if (!templateData || !templateData.content) {
        return (
            <div style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>Loading Template...</p>
            </div>
        );
    }

    const { content } = templateData;
    const {
        topText = 'Ignite Your Full Potential ->',
        title = 'Forge Your Ultimate Physique',
        subtitle = 'Explore personalized workout plans where cutting-edge technology merges with elite fitness expertise.',
        primaryButton = { text: 'Start Workout', link: '/workout' },
        secondaryButton = { text: 'Learn More', link: '/about' },
        stats = [],
    } = content;

    const statIcons = {
        dumbbell: <FaDumbbell />,
        users: <FaUsers />,
        'list-check': <FaTasks />,
        'user-tie': <FaUserTie />,
    };
    
    const getStatPosition = (index) => {
        const positions = [
            { top: '15%', left: '10%' },
            { top: '25%', right: '8%' },
            { bottom: '20%', left: '20%' },
            { bottom: '30%', right: '15%' },
        ];
        return positions[index % positions.length];
    };

    return (
        <>
            <style>
                {`
                @keyframes float {
                    0% { transform: translatey(0px); }
                    50% { transform: translatey(-20px); }
                    100% { transform: translatey(0px); }
                }
                @keyframes sparkle {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(0); opacity: 0; }
                }
                .star {
                    position: absolute;
                    width: 2px;
                    height: 2px;
                    background: white;
                    border-radius: 50%;
                    animation: sparkle 5s infinite;
                }
                `}
            </style>
            <div style={styles.container}>
                <div style={styles.backgroundGlow}></div>
                {[...Array(50)].map((_, i) => (
                    <div key={i} className="star" style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${2 + Math.random() * 3}s`
                    }}></div>
                ))}
                
                {content.showStats && stats.length > 0 && (
                    <div style={styles.statContainer}>
                        {stats.slice(0, 4).map((stat, index) => (
                            <div key={index} style={{ ...styles.statItem, ...getStatPosition(index), animationDelay: `${index * 1.5}s` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ color: '#d1d5db', opacity: 0.7, fontSize: '1.5rem' }}>{stat.icon && statIcons[stat.icon]}</span>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', color: '#d1d5db' }}>{stat.label}</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{stat.value}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={styles.contentWrapper}>
                    {topText && <div style={styles.topText}>{topText}</div>}
                    <h1 style={styles.title}>{title}</h1>
                    <p style={styles.subtitle}>{subtitle}</p>
                    <div style={styles.buttonContainer}>
                        <Link to={primaryButton.link || '/'} style={styles.primaryButton}>{primaryButton.text || 'Get Started'}</Link>
                        <Link to={secondaryButton.link || '/'} style={styles.secondaryButton}>{secondaryButton.text || 'Learn More'}</Link>
                    </div>
                </div>
            </div>
        </>
    );
});

ModernTechHeroTemplate.displayName = 'ModernTechHeroTemplate';

export default ModernTechHeroTemplate; 