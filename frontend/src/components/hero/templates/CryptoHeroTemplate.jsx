import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaDumbbell, FaHeartbeat, FaChartLine } from 'react-icons/fa';

const CryptoHeroTemplate = memo(({ templateData, userInfo }) => {
    const styles = useMemo(() => ({
        container: {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'auto',
            height: 'auto',
            padding: '4rem 2rem',
            margin: '0rem 0 2rem 0',
            background: 'radial-gradient(ellipse at 50% 40%, #2C3E50 0%, #1a1a2e 70%)',
            color: '#fff',
            overflow: 'hidden',
        },
        contentWrapper: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '1200px',
            width: '100%',
            gap: '2rem',
            position: 'relative',
            zIndex: 2,
        },
        textContainer: {
            flex: 1,
            maxWidth: '600px',
            textAlign: 'left',
        },
        tag: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '50px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            fontSize: '0.9rem',
            fontWeight: '600',
            marginBottom: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        tagIcon: {
            color: '#4CAF50',
        },
        title: {
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            fontWeight: '700',
            lineHeight: 1.2,
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #4CAF50 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
        },
        highlightedText: {
            color: '#4CAF50',
            position: 'relative',
            display: 'inline-block',
        },
        subtitle: {
            fontSize: 'clamp(1rem, 1.5vw, 1.1rem)',
            color: '#B0BEC5',
            marginBottom: '2.5rem',
            lineHeight: '1.6',
        },
        statsContainer: {
            display: 'flex',
            gap: '2rem',
            marginBottom: '2.5rem',
        },
        statItem: {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
        },
        statValue: {
            fontSize: '1.8rem',
            fontWeight: '700',
            color: '#4CAF50',
        },
        statLabel: {
            fontSize: '0.9rem',
            color: '#B0BEC5',
        },
        ctaButton: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 2rem',
            background: '#4CAF50',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '50px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            border: 'none',
            boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
            cursor: 'pointer',
        },
        ctaIconWrapper: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
        },
        graphicContainer: {
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
        },
        graphic: {
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        },
        backgroundGlow: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '120%',
            height: '120%',
            background: 'radial-gradient(circle, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0) 70%)',
            zIndex: 1,
        },
    }), []);

    if (!templateData || !templateData.content) {
        return (
            <div style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>Loading Template...</p>
            </div>
        );
    }

    const { content } = templateData;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const {
        tagline = userInfo 
            ? `${getGreeting()}, ${userInfo.name?.split(' ')[0] || 'Champion'}`
            : 'AI-Powered Fitness Evolution',
        titleLine1 = userInfo 
            ? 'Your Progress'
            : 'Transform Your',
        titleLine2 = userInfo
            ? 'Matters'
            : 'Fitness Journey',
        titleLine3Highlighted = userInfo
            ? 'Every Day'
            : 'With Smart Tech',
        subtitle = userInfo
            ? `Your personalized workout and nutrition plans are ready. Today's focus: High-Intensity Training & Macro-Balanced Nutrition.`
            : `Experience the future of fitness with AI-driven personalized workouts, real-time progress tracking, and nutrition optimization. Your transformation starts here.`,
        stats = [
            { value: '93%', label: 'Success Rate' },
            { value: '45K+', label: 'Active Users' },
            { value: '4.9', label: 'User Rating' }
        ],
        buttonText = userInfo ? 'Continue Training' : 'Start Your Journey',
        buttonLink = userInfo ? '/dashboard' : '/register',
        graphicUrl = '/images/dashboard-preview.png'
    } = content;

    return (
        <div style={styles.container}>
            <div style={styles.backgroundGlow} />
            <div style={styles.contentWrapper}>
                <div style={styles.textContainer}>
                    <div style={styles.tag}>
                        <FaDumbbell style={styles.tagIcon} />
                        <span>{tagline}</span>
                    </div>
                    
                    <h1 style={styles.title}>
                        {titleLine1}{' '}
                        {titleLine2}{' '}
                        <span style={styles.highlightedText}>
                            {titleLine3Highlighted}
                        </span>
                    </h1>

                    <p style={styles.subtitle}>{subtitle}</p>

                    <div style={styles.statsContainer}>
                        {stats.map((stat, index) => (
                            <div key={index} style={styles.statItem}>
                                <span style={styles.statValue}>{stat.value}</span>
                                <span style={styles.statLabel}>{stat.label}</span>
                            </div>
                        ))}
                    </div>

                    <Link to={buttonLink} style={styles.ctaButton}>
                        <span>{buttonText}</span>
                        <div style={styles.ctaIconWrapper}>
                            <FaArrowRight size={12} />
                        </div>
                    </Link>
                </div>

                <div style={styles.graphicContainer}>
                    {graphicUrl && (
                        <img 
                            src={graphicUrl} 
                            alt="Fitness Dashboard Preview" 
                            style={styles.graphic}
                        />
                    )}
                </div>
            </div>
        </div>
    );
});

CryptoHeroTemplate.displayName = 'CryptoHeroTemplate';

export default CryptoHeroTemplate; 