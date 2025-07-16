import React, { memo, useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

const CorporateTechHeroTemplate = memo(({ templateData, userInfo, forceRefreshKey }) => {
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
            minHeight: 'auto',
            height: 'auto',
            padding: '4rem 2rem',
            margin: '0rem 0 2rem 0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            background: '#0a0a1a',
            color: '#ffffff',
            overflow: 'hidden',
        },
        backgroundGlow: {
            position: 'absolute',
            top: '0',
            right: '0',
            width: '800px',
            height: '800px',
            background: 'radial-gradient(circle, rgba(29, 78, 216, 0.4) 0%, #0a0a1a 70%)',
            zIndex: 1,
        },
        contentWrapper: {
            position: 'relative',
            zIndex: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '1200px',
            width: '100%',
        },
        topTagline: {
            display: 'inline-block',
            padding: '0.5rem 1rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#e5e7eb',
            backdropFilter: 'blur(5px)',
        },
        title: {
            fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
            fontWeight: 'bold',
            lineHeight: 1.2,
            marginBottom: '1rem',
            maxWidth: '800px',
        },
        highlightedText: {
            color: '#38bdf8',
            position: 'relative',
            display: 'inline-block',
        },
        underline: {
            position: 'absolute',
            bottom: '-5px',
            left: '0',
            width: '100%',
            height: '4px',
            background: '#38bdf8',
        },
        subtitle: {
            fontSize: 'clamp(1rem, 2vw, 1.1rem)',
            marginBottom: '2.5rem',
            maxWidth: '600px',
            color: '#d1d5db',
            opacity: 0.9,
        },
        primaryButton: {
            padding: '1rem 2.5rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            borderRadius: '50px',
            border: 'none',
            background: '#38bdf8',
            color: '#0a0a1a',
            textDecoration: 'none',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(56, 189, 248, 0.3)',
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
        topTagline = 'Welcome to GRINDX',
        titleLine1 = 'Transform Your',
        titleLine2Highlighted = 'Workout Strategy',
        titleLine3 = 'with the Power of AI',
        subtitle = 'Boost your performance, increase ROI on your effort, and unlock data-driven insights with our advanced fitness solutions.',
        primaryButton = { text: 'Get Started', link: '/register' },
    } = content;

    return (
        <div style={styles.container}>
            <style>
                {`
                @keyframes sparkle-blue {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(0); opacity: 0; }
                }
                .star-blue {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    background: #38bdf8;
                    border-radius: 50%;
                    animation: sparkle-blue 7s infinite;
                    opacity: 0;
                }
                `}
            </style>
            <div style={styles.backgroundGlow}></div>
            {[...Array(100)].map((_, i) => (
                <div key={i} className="star-blue" style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 7}s`,
                    animationDuration: `${3 + Math.random() * 4}s`
                }}></div>
            ))}
            
            <div style={styles.contentWrapper}>
                {topTagline && <div style={styles.topTagline}>{topTagline}</div>}
                
                <h1 style={styles.title}>
                    {titleLine1}{' '}
                    <span style={styles.highlightedText}>
                        {titleLine2Highlighted}
                        <span style={styles.underline}></span>
                    </span>{' '}
                    {titleLine3}
                </h1>

                <p style={styles.subtitle}>{subtitle}</p>
                
                <Link to={primaryButton.link || '/'} style={styles.primaryButton}>
                    {primaryButton.text || 'Get Started'}
                </Link>

            </div>
        </div>
    );
});

CorporateTechHeroTemplate.displayName = 'CorporateTechHeroTemplate';

export default CorporateTechHeroTemplate; 