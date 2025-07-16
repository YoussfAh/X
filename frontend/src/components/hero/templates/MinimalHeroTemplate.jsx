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
        padding: '4rem 1rem',
        margin: '0rem 0 2rem 0',
        textAlign: 'center',
        background: isDarkMode
            ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: '15px',
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'translateZ(0)', // GPU acceleration
        willChange: 'transform, opacity',
        border: '2px solid #4F46E5' // Visual indicator this is the active template
    },
    title: {
        fontSize: 'clamp(2rem, 4vw, 3rem)',
        fontWeight: '700',
        marginBottom: '1rem',
        lineHeight: '1.2',
        color: isDarkMode ? '#ffffff' : '#1a202c',
        letterSpacing: '-0.01em'
    },
    subtitle: {
        fontSize: 'clamp(1rem, 2vw, 1.2rem)',
        lineHeight: '1.6',
        marginBottom: '2rem',
        color: isDarkMode ? '#a0aec0' : '#4a5568',
        fontWeight: '400',
        maxWidth: '600px'
    },
    button: {
        background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
        color: 'white',
        border: 'none',
        padding: '0.875rem 2rem',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'inline-block',
        transition: 'all 0.3s ease',
        boxShadow: `0 4px 15px rgba(79, 70, 229, 0.2)`,
        transform: 'translateY(0)',
        '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: `0 6px 20px rgba(79, 70, 229, 0.3)`
        }
    },
    debugInfo: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'monospace'
    }
});

const MinimalHeroTemplate = memo(({ templateData, userInfo, forceRefreshKey }) => {
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );
    
    const [animationsEnabled, setAnimationsEnabled] = useState(false);
    const [renderKey, setRenderKey] = useState(0);
    const prevTitle = React.useRef();

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

    // Force re-render when forceRefreshKey changes
    useEffect(() => {
        setRenderKey(prev => prev + 1);
    }, [forceRefreshKey]);

    // Track content changes (only log when data actually changes)
    useEffect(() => {
        if (templateData?.content?.title !== prevTitle.current) {
            prevTitle.current = templateData?.content?.title;
        }
    }, [templateData]);

    // Ensure we have template data
    if (!templateData || !templateData.content) {
        return (
            <div style={styles.container}>
                <h1 style={styles.title}>Loading...</h1>
            </div>
        );
    }

    const { content } = templateData;

    // Extract content with fallbacks
    const displayTitle = content.title || 'Default Title';
    const displaySubtitle = content.subtitle || 'Default subtitle';
    const displayButtonText = content.buttonText || 'Default Button';
    const displayButtonLink = content.buttonLink || '/collections';

    return (
        <div 
            key={`minimal-${renderKey}-${forceRefreshKey}`}
            style={{
                ...styles.container,
                opacity: animationsEnabled ? 1 : 0,
                transform: animationsEnabled ? 'translateY(0)' : 'translateY(10px)',
                transition: 'all 0.6s cubic-bezier(0.2, 1, 0.3, 1)'
            }}
        >
            <h1 style={styles.title}>
                {displayTitle}
            </h1>
            
            <p style={styles.subtitle}>
                {displaySubtitle}
            </p>
            
            <Link 
                to={displayButtonLink}
                style={styles.button}
                onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.3)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(79, 70, 229, 0.2)';
                }}
            >
                {displayButtonText}
            </Link>
        </div>
    );
});

MinimalHeroTemplate.displayName = 'MinimalHeroTemplate';

export default MinimalHeroTemplate; 