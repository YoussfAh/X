import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaDumbbell, FaChartLine } from 'react-icons/fa';

const FitnessHeroTemplate = memo(({ templateData, userInfo }) => {

    const styles = useMemo(() => ({
        container: {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '70vh',
            padding: '4rem 2rem',
            margin: '2rem 0 2rem 0',
            background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000000 70%)',
            color: '#f9fafb',
            overflow: 'hidden',
        },
        contentWrapper: {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '1200px',
            width: '100%',
            gap: '4rem',
            zIndex: 1,
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
            padding: '0.3rem 1rem',
            borderRadius: '20px',
            background: 'rgba(52, 211, 153, 0.1)',
            color: '#34d399',
            fontSize: '0.875rem',
            fontWeight: '600',
            marginBottom: '1.5rem',
            border: '1px solid rgba(52, 211, 153, 0.2)',
        },
        title: {
            fontSize: 'clamp(2.5rem, 7vw, 3.5rem)',
            fontWeight: '800',
            lineHeight: 1.15,
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em',
        },
        highlightedText: {
            color: '#34d399',
        },
        subtitle: {
            fontSize: 'clamp(1rem, 4vw, 1.1rem)',
            color: '#d1d5db',
            marginBottom: '2.5rem',
            maxWidth: '500px',
            lineHeight: 1.6,
        },
        ctaButton: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1.75rem',
            background: '#34d399',
            color: '#111827',
            textDecoration: 'none',
            borderRadius: '50px',
            fontWeight: '700',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(52, 211, 153, 0.2)',
        },
        graphicContainer: {
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        },
        graphic: {
            width: '100%',
            maxWidth: '450px',
            height: 'auto',
            borderRadius: '20px',
            objectFit: 'cover',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            border: '3px solid rgba(255, 255, 255, 0.1)',
        },
    }), []);

    if (!templateData || !templateData.content) {
        return (
            <div style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: styles.container.background }}>
                <p>Loading Template...</p>
            </div>
        );
    }

    const { content } = templateData;
    const {
        tagline = 'WORKOUTS. NUTRITION. RESULTS.',
        titleLine1 = 'Custom Gym & Diet',
        titleLine2Highlighted = 'Training Plans',
        subtitle = `Unlock your true potential with personalized training programs and AI-driven diet plans. Stop guessing and start achieving measurable results in the gym and in the kitchen.`,
        buttonText = 'View My Plan',
        buttonLink = userInfo ? '/profile' : '/login',
        graphicUrl = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop'
    } = content;

    return (
        <div style={styles.container} className="fitness-hero-container">
            <div style={styles.contentWrapper} className="fitness-hero-content-wrapper">
                <div style={styles.textContainer} className="fitness-hero-text-container">
                    <div style={styles.tag}>
                        <FaChartLine />
                        <span>{tagline}</span>
                    </div>
                    <h1 style={styles.title}>
                        {titleLine1} <span style={styles.highlightedText}>{titleLine2Highlighted}</span>
                    </h1>
                    <p style={styles.subtitle}>{subtitle}</p>
                    <Link to={buttonLink} style={styles.ctaButton} className="hero-cta-button">
                        <span>{buttonText}</span>
                        <FaArrowRight size={14} />
                    </Link>
                </div>
                <div style={styles.graphicContainer} className="fitness-hero-graphic-container">
                    {graphicUrl && <img src={graphicUrl} alt="Fitness Journey" style={styles.graphic} />}
                </div>
            </div>
            <style>{`
                .hero-cta-button:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 7px 20px rgba(52, 211, 153, 0.3);
                }

                @media (max-width: 768px) {
                    .fitness-hero-container {
                        padding: 4rem 1.5rem;
                        min-height: auto;
                    }
                    .fitness-hero-content-wrapper {
                        flex-direction: column;
                        text-align: center;
                        gap: 2.5rem;
                    }
                    .fitness-hero-text-container {
                        max-width: 100%;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }
                    .fitness-hero-graphic-container {
                        order: -1;
                        margin-bottom: 1rem;
                    }
                }
            `}</style>
        </div>
    );
});

FitnessHeroTemplate.displayName = 'FitnessHeroTemplate';

export default FitnessHeroTemplate; 