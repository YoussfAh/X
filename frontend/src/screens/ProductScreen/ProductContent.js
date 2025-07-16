// Note: This file was previously called ProductContent but now displays exercise content
// Keeping the component name for backend API compatibility
import React, { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { FaDumbbell, FaArrowDown, FaArrowUp, FaPlus, FaImage, FaTags, FaQuoteLeft, FaUtensils, FaEye } from 'react-icons/fa';
import { Row, Col, Button, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useDeleteWorkoutEntryMutation, useGetWorkoutEntriesByProductQuery } from '../../slices/workoutApiSlice';
import { useGetMyDietEntriesQuery } from '../../slices/dietApiSlice';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import { format } from 'date-fns';
import { showSuccessToast } from '../../utils/toastConfig';

// Lazy load components
const WorkoutEntryForm = lazy(() => import('../../components/WorkoutEntryForm'));
const VideoSection = lazy(() => import('./VideoSection'));
const DietEntryForm = lazy(() => import('../../components/DietEntryForm'));

// Utility function to parse description text with link syntax
// Format: [visible text](url)
const parseDescriptionWithLinks = (description) => {
    if (!description) return '';

    // Regular expression to match [text](url) pattern
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    // Split the description by link patterns
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(description)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
            parts.push({
                type: 'text',
                content: description.substring(lastIndex, match.index)
            });
        }

        // Add the link
        parts.push({
            type: 'link',
            text: match[1],
            url: match[2]
        });

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text after the last match
    if (lastIndex < description.length) {
        parts.push({
            type: 'text',
            content: description.substring(lastIndex)
        });
    }

    return parts;
};

// Fast Arabic detection - check first character only
const isArabicText = (text) => {
    if (!text || text.length === 0) return false;
    const firstChar = text.trim().charAt(0);
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(firstChar);
};

// Function to adjust text readability based on screen size and theme
const getOptimizedTextColor = (isDark, isMobileCheck) => {
    if (!isMobileCheck) {
        // Softer colors for desktop: less white in dark mode, warmer black in light mode
        return isDark ? 'rgba(242, 242, 247, 0.78)' : 'rgba(45, 45, 45, 0.8)';
    }
    // Enhanced readability for mobile with softer contrast
    return isDark ? 'rgba(242, 242, 247, 0.85)' : 'rgba(50, 50, 50, 0.85)';
};

// Function to calculate optimal paragraph spacing based on screen size
const getParagraphSpacing = (isMobileCheck, index, total) => {
    // First paragraph needs less space if we have a top margin already
    if (index === 0) {
        return isMobileCheck ? '0.5rem' : '0.7rem';
    }
    // Last paragraph doesn't need margin bottom
    if (index === total - 1) {
        return '0'; // Use string to ensure consistency
    }
    // Middle paragraphs get progressively smaller spacing on mobile
    return isMobileCheck ? '0.65rem' : '0.9rem'; // Slightly reduced spacing for better flow
};

// Function to render text with proper paragraph formatting
const renderTextWithParagraphs = (text, isDarkModeParam, isMobileParam) => {
    if (!text) return null;

    // Split text into paragraphs by double newlines
    const paragraphs = text.split(/\n\s*\n/);
    const isRTL = isArabicText(text);

    return paragraphs.map((paragraph, i) => (
        <p key={i} style={{ 
            marginBottom: getParagraphSpacing(isMobileParam, i, paragraphs.length),
            marginTop: i === 0 && isMobileParam ? '8px' : 0, // Add top margin only to first paragraph on mobile
            textAlign: isRTL ? 'right' : 'left',
            direction: isRTL ? 'rtl' : 'ltr',
            width: '100%',
            minHeight: i === paragraphs.length - 1 ? 'auto' : (isMobileParam ? '20px' : '28px'), // Remove min height for last paragraph
            wordSpacing: isMobileParam ? '0.02em' : '0.01em', // Slightly increased word spacing for better readability
            letterSpacing: '0.01em', // Slight letter spacing enhancement
            lineHeight: isMobileParam ? '1.5' : '1.75',  // Increased line height for better readability
            padding: '0',       // Remove any default padding
            color: getOptimizedTextColor(isDarkModeParam, isMobileParam), // Apply optimized text color
            fontWeight: '400', // Ensure consistent font weight
            textRendering: 'optimizeLegibility', // Better text rendering
        }}>
            {paragraph.replace(/\n/g, ' ')}
        </p>
    ));
};

const ProductContent = ({ product, isDarkMode, inCollection, productId, workoutCollection }) => {
    const accentColor = '#9d4edd';
    const secondaryAccent = '#7b2cbf';
    const trueBlack = '#000000';
    const deepDark = 'rgba(5, 5, 10, 0.95)';

    const [entryToEdit, setEntryToEdit] = useState(null);
    const [deleteWorkoutEntry] = useDeleteWorkoutEntryMutation();
    const [refreshKey, setRefreshKey] = useState(0);
    const [workoutSectionExpanded, setWorkoutSectionExpanded] = useState(false);
    const [dietSectionExpanded, setDietSectionExpanded] = useState(false);
    const location = useLocation();
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const imageRef = useRef(null);
    const imageObserverRef = useRef(null);

    const effectiveProductId = productId || product?._id || '';

    let collectionId = null;
    if (location.pathname.includes('/collections/')) {
        const matches = location.pathname.match(/\/collections\/([^\/]+)/);
        if (matches && matches[1]) {
            collectionId = matches[1];
        }
    }
    if (!collectionId && workoutCollection && workoutCollection._id) {
        collectionId = workoutCollection._id;
    }
    if (!collectionId && product?.collections?.length > 0) {
        collectionId = product.collections[0]._id;
    }

    // Memoize the colors object to prevent recreation on each render
    const colors = useMemo(() => ({
        dark: {
            background: '#000000', // Pure black for dark mode
            surface: '#000000',
            surfaceLight: '#000000',
            text: 'rgba(242, 242, 247, 0.88)', // Softer white for main text
            textSecondary: 'rgba(242, 242, 247, 0.7)', // Reduced opacity for secondary text
            accent: '#9d4edd',
            accentDark: '#7b2cbf',
            accentTransparent: 'rgba(157, 78, 221, 0.15)',
            border: 'transparent',
            overlay: 'rgba(0, 0, 0, 0.7)',
            modalBg: '#000000',
        },
        light: {
            background: '#f8f9fa', // Slightly off-white for better comfort
            surface: 'rgba(248, 249, 250, 0.95)',
            surfaceLight: 'rgba(241, 242, 245, 0.95)',
            text: 'rgba(45, 55, 72, 0.88)', // Softer dark blue-gray instead of pure black
            textSecondary: 'rgba(60, 60, 67, 0.7)', // Warmer gray for secondary text
            accent: '#9d4edd',
            accentDark: '#7b2cbf',
            accentTransparent: 'rgba(157, 78, 221, 0.08)',
            border: 'transparent',
            overlay: 'rgba(0, 0, 0, 0.05)',
            modalBg: 'rgba(248, 249, 250, 0.98)',
        }
    }), []); // Empty dependency array since these values never change

    const currentTheme = useMemo(() => isDarkMode ? colors.dark : colors.light, [isDarkMode, colors]);

    // Memoize all static styles
    const styles = useMemo(() => ({
        cardStyle: {
            backgroundColor: currentTheme.background,
            borderRadius: '0',
            overflow: 'hidden',
            boxShadow: 'none',
            border: 'none',
            width: '100%',
            marginBottom: '0',
            backdropFilter: 'blur(12px)',
            maxWidth: '100%',
            padding: '0',
        },
        titleStyle: {
            fontWeight: '700',
            color: currentTheme.text,
            fontSize: isMobile ? '1.9rem' : '2.2rem',
            lineHeight: '1.2',
            marginBottom: '1rem',
            position: 'relative',
            display: 'inline-block',
            fontFamily: "'Poppins', sans-serif",
            textShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : 'none',
            letterSpacing: '0.01em',
            padding: '0 2px 8px 2px',
        },
        imageContainer: {
            width: '100%',
            height: isMobile ? '350px' : inCollection ? '500px' : '600px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '0',
            backgroundColor: isDarkMode ? '#000000' : currentTheme.background,
            margin: '0',
            maxWidth: '100%',
            border: 'none',
            boxShadow: 'none',
        },
        descriptionStyle: {
            padding: isMobile ? '16px 12px' : '28.8px', // Further reduce padding on mobile
            backgroundColor: isDarkMode ? '#000000' : currentTheme.surface,
            borderRadius: isMobile ? '12px' : '0',
            boxShadow: 'none',
            minHeight: isMobile ? 'auto' : '250px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            width: '100%',
            maxWidth: '100%',
            margin: isMobile ? '0 auto' : '0',
            backdropFilter: isDarkMode ? 'none' : 'blur(10px)',
            WebkitBackdropFilter: isDarkMode ? 'none' : 'blur(10px)',
            border: 'none',
        },
        descriptionTextStyle: {
            color: getOptimizedTextColor(isDarkMode, isMobile),
            fontSize: isMobile ? '1rem' : '1.05rem', // Appropriate size for different screens
            lineHeight: isMobile ? '1.5' : '1.8', // Better line height for readability
            letterSpacing: '0.01em', // Slightly increased letter spacing for better reading
            fontWeight: '400',
            margin: isMobile ? '10px 0 0 0' : 0, // Add top margin only on mobile
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
            position: 'relative',
            padding: isMobile ? '0 2px' : '0 4px', // Tighter padding on mobile
            width: '100%',
            minHeight: 'auto', // Auto height to prevent extra spacing
            textRendering: 'optimizeLegibility', // Enhance text readability
            textShadow: isDarkMode ? '0 0.3px 0.5px rgba(0,0,0,0.15)' : 'none', // Subtle text shadow in dark mode
        },
        trackingSection: {
            backgroundColor: workoutSectionExpanded ? currentTheme.modalBg : currentTheme.surface,
            width: '100%',
            margin: '0',
            padding: '0',
            borderRadius: '0',
            overflow: 'hidden',
        },
        trackingHeader: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            padding: isMobile ? '12px 16px' : '16px 24px',
            background: workoutSectionExpanded ?
                `linear-gradient(to right, ${currentTheme.accentTransparent}, transparent 80%)` :
                'transparent',
            borderBottom: workoutSectionExpanded ? `1px solid ${currentTheme.accentTransparent}` : 'none',
        },
        trackingTitle: {
            color: currentTheme.text,
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600',
            margin: 0,
            opacity: workoutSectionExpanded ? 1 : 0.9,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        },
        formContainer: {
            padding: isMobile ? '12px' : '20px',
            background: currentTheme.modalBg,
            width: '100%',
            maxWidth: '100%',
        },
    }), [currentTheme, isDarkMode, isMobile, workoutSectionExpanded]);

    // Exercise tracking specific styles - UPDATED
    const exerciseStyles = useMemo(() => ({
        section: {
            backgroundColor: isDarkMode ? '#000000' : (workoutSectionExpanded ? currentTheme.modalBg : currentTheme.surface),
            width: '100%',
            margin: '0',
            padding: '0',
            borderRadius: workoutSectionExpanded ? '16px' : '0',
            overflow: 'hidden',
            transition: 'background-color 0.3s ease',
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            padding: isMobile ? '16px 18px' : '20px 28px',
            background: workoutSectionExpanded ?
                `linear-gradient(to right, ${currentTheme.accentTransparent}, transparent 80%)` :
                'transparent',
            borderBottom: workoutSectionExpanded ? `1px solid ${currentTheme.accentTransparent}` : 'none',
            borderTopLeftRadius: workoutSectionExpanded ? '16px' : '0',
            borderTopRightRadius: workoutSectionExpanded ? '16px' : '0',
            transition: 'all 0.3s ease',
        },
        button: {
            color: '#fff',
            background: `linear-gradient(135deg, ${currentTheme.accent}, ${currentTheme.accentDark})`,
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            fontWeight: '500',
            borderRadius: '16px',
            border: 'none',
            padding: isMobile ? '8px 14px' : '10px 20px',
            textDecoration: 'none',
            boxShadow: isDarkMode ? 
                '0 3px 15px rgba(157, 78, 221, 0.3)' : 
                '0 2px 10px rgba(157, 78, 221, 0.2)',
            opacity: 0.95,
            cursor: 'pointer',
            minWidth: isMobile ? '90px' : '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.3s ease',
        },
        icon: {
            width: isMobile ? '28px' : '38px',
            height: isMobile ? '28px' : '38px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: currentTheme.accentTransparent,
            boxShadow: isDarkMode ? 
                '0 0 20px rgba(157, 78, 221, 0.2)' : 
                '0 2px 8px rgba(157, 78, 221, 0.15)',
        },
        formContainer: {
            padding: isMobile ? '12px' : '20px',
            background: isDarkMode ? '#000000' : currentTheme.modalBg,
            width: '100%',
            maxWidth: '100%',
            color: currentTheme.text,
            transition: 'background-color 0.3s ease',
        }
    }), [currentTheme, isDarkMode, isMobile, workoutSectionExpanded]);

    // Colors for meal tracking based on collection
    const mealColors = useMemo(() => ({
        special: {
            primary: '#22c55e',
            secondary: '#16a34a',
            transparent: 'rgba(34, 197, 94, 0.15)',
            border: 'rgba(34, 197, 94, 0.2)',
            shadow: 'rgba(34, 197, 94, 0.3)',
            shadowLight: 'rgba(34, 197, 94, 0.2)',
            shadowLighter: 'rgba(34, 197, 94, 0.15)',
        },
        default: {
            primary: '#3b82f6',
            secondary: '#2563eb',
            transparent: 'rgba(59, 130, 246, 0.15)',
            border: 'rgba(59, 130, 246, 0.2)',
            shadow: 'rgba(59, 130, 246, 0.3)',
            shadowLight: 'rgba(59, 130, 246, 0.2)',
            shadowLighter: 'rgba(59, 130, 246, 0.15)',
        }
    }), []);

    // Get the appropriate color scheme based on collectionId
    const activeMealColors = useMemo(() => {
        return collectionId === '68247963d64a2dc8c65345b4' ? mealColors.special : mealColors.default;
    }, [collectionId, mealColors]);

    // Meal tracking specific styles
    const mealStyles = useMemo(() => ({
        section: {
            backgroundColor: isDarkMode ? '#000000' : '#ffffff', // Pure black for dark mode, white for light mode
            width: '100%',
            margin: '0',
            padding: '0',
            borderRadius: '0', // Remove border radius to eliminate spacing
            overflow: 'hidden',
            transition: 'background-color 0.3s ease',
            border: 'none', // Remove any borders
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            padding: isMobile ? '16px 18px' : '20px 28px',
            background: isDarkMode ? '#000000' : '#ffffff', // Match section background
            borderBottom: 'none', // Remove border
            width: '100%',
            borderRadius: '0', // Remove border radius
            transition: 'all 0.3s ease',
            margin: '0', // Remove margins
        },
        button: {
            color: '#ffffff',
            background: `linear-gradient(135deg, ${activeMealColors.primary}, ${activeMealColors.secondary})`,
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            fontWeight: '500',
            borderRadius: '16px',
            border: 'none',
            padding: isMobile ? '8px 14px' : '10px 20px',
            textDecoration: 'none',
            boxShadow: isDarkMode ? `0 3px 15px ${activeMealColors.shadow}` : `0 2px 10px ${activeMealColors.shadowLight}`,
            opacity: 0.95,
            cursor: 'pointer',
            minWidth: isMobile ? '90px' : '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.3s ease',
        },
        icon: {
            width: isMobile ? '28px' : '38px',
            height: isMobile ? '28px' : '38px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.15)',
            boxShadow: isDarkMode ? `0 0 20px ${activeMealColors.shadowLight}` : `0 2px 8px ${activeMealColors.shadowLighter}`,
            marginRight: '8px',
        },
        formContainer: {
            padding: isMobile ? '12px' : '20px',
            background: isDarkMode ? '#000000' : '#ffffff', // Pure black for dark mode, white for light mode
            width: '100%',
            maxWidth: '100%',
            color: isDarkMode ? '#ffffff' : '#000000', // White text on dark, black text on light
            borderRadius: '0', // Remove border radius
            transition: 'background-color 0.3s ease, color 0.3s ease',
            margin: '0', // Remove margins
            border: 'none', // Remove borders
        }
    }), [activeMealColors, isDarkMode, isMobile, dietSectionExpanded, currentTheme]);

    const unifiedDescriptionStyle = {
        padding: '28.8px',  // Match the wider style from the second image
        backgroundColor: isDarkMode ? '#000000' : currentTheme.surface,
        borderRadius: '16px',
        boxShadow: isDarkMode 
            ? '0 8px 30px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05)' 
            : '0 8px 30px rgba(0, 0, 0, 0.08)',
        backdropFilter: isDarkMode ? 'none' : 'blur(10px)',
        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid rgba(0, 0, 0, 0.02)',
        width: '100%',
        minWidth: '412px',  // Match the wider style from the second image
        maxWidth: '100%',   // Ensure it doesn't overflow on mobile
        marginBottom: '2rem',
        color: currentTheme.text,
    };

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const {
        data: workoutEntries,
        refetch
    } = useGetWorkoutEntriesByProductQuery(
        effectiveProductId,
        {
            skip: !effectiveProductId || effectiveProductId === '' || product?.isMealDiet,
            refetchOnMountOrArgChange: true
        }
    );

    // Diet entries query for meal/diet products
    const {
        data: dietData,
        refetch: refetchDiet
    } = useGetMyDietEntriesQuery(
        {
            limit: 10
        },
        {
            skip: !product?.isMealDiet
        }
    );

    useEffect(() => {
        if (effectiveProductId && refetch && !product?.isMealDiet) {
            refetch().catch(err => console.error('Error fetching exercise entries:', err));
        }
    }, [effectiveProductId, refreshKey, refetch, product?.isMealDiet]);

    // Setup intersection observer for image lazy loading
    useEffect(() => {
        if (!imageRef.current) return;

        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && imageRef.current) {
                    const img = imageRef.current;
                    img.src = product.image;
                    observer.unobserve(img);
                }
            });
        }, options);

        observer.observe(imageRef.current);
        imageObserverRef.current = observer;

        return () => {
            if (imageObserverRef.current) {
                imageObserverRef.current.disconnect();
            }
        };
    }, [product.image]);

    // Optimize image loading
    const handleImageLoad = useCallback(() => {
        requestAnimationFrame(() => {
            setImageLoaded(true);
        });
    }, []);

    // Optimize section expansion
    const toggleWorkoutSection = useCallback((e) => {
        if (e) {
            e.stopPropagation();
        }
        setWorkoutSectionExpanded(prev => !prev);
    }, []);

    const toggleDietSection = useCallback((e) => {
        if (e) {
            e.stopPropagation();
        }
        setDietSectionExpanded(prev => !prev);
    }, []);

    // Memoize the workout success handler
    const handleWorkoutSuccess = useCallback(() => {
        showSuccessToast('Exercise logged successfully');
        setWorkoutSectionExpanded(false);
        setEntryToEdit(null);
    }, []);

    const handleDietSuccess = useCallback(() => {
        showSuccessToast('Meal logged successfully');
        setDietSectionExpanded(false);
        if (refetchDiet) {
            try {
                refetchDiet();
            } catch (refetchError) {
                console.warn('Diet refetch failed:', refetchError);
            }
        }
    }, [refetchDiet]);

    const responsiveStyles = {
        detailsContainer: {
            height: '100%',
            width: '100%',
            padding: '0',
        },
        fallbackImageContainer: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            opacity: 0.6
        }
    };

    // Parse the description to handle links
    const parsedDescription = parseDescriptionWithLinks(product.description);

    // State for hover effect
    const [isDescHovered, setIsDescHovered] = useState(false);

    return (
        <div className="w-100 p-0" style={{ background: isDarkMode ? '#000000' : currentTheme.background }}>
            <div className='product-main' style={styles.cardStyle}>
                <div className='row g-0 w-100 mx-0'>
                    <div className='col-12 px-0 pt-4 pb-2'>  {/* Remove horizontal padding */}
                        <div className="d-flex flex-wrap align-items-center mb-4 px-4">  {/* Add padding to title only */}
                            <h1 style={styles.titleStyle}>
                                {product.name}
                                <div style={{
                                    height: '2px',
                                    width: '100%',
                                    background: `linear-gradient(to right, ${currentTheme.accent} 0%, ${currentTheme.accent}88 60%, transparent 100%)`,
                                    position: 'absolute',
                                    bottom: '0',
                                    left: '0',
                                    borderRadius: '2px',
                                    boxShadow: isDarkMode ? `0 1px 3px ${currentTheme.accent}66` : 'none',
                                }}></div>
                            </h1>
                        </div>
                    </div>

                    {/* Image Section - Only render if image exists and hasn't errored */}
                    {!imageError && product.image && (
                        <div className='col-12 px-0 pb-4'>  {/* Remove horizontal padding */}
                            <div className='product-image-container' style={styles.imageContainer}>
                                <img
                                    ref={imageRef}
                                    alt={product.name}
                                    className={`product-main-image ${imageLoaded ? 'fade-in' : 'invisible'}`}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: '12px',
                                        opacity: imageLoaded ? 1 : 0,
                                        maxWidth: '100%',
                                        boxShadow: isDarkMode ? '0 4px 20px rgba(0, 0, 0, 0.6)' : 'none',
                                    }}
                                    onLoad={handleImageLoad}
                                    onError={() => setImageError(true)}
                                    loading="lazy"
                                />
                                {!imageLoaded && !imageError && (
                                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                                        <Loader />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Description Section - Always render with consistent styling */}
                    <div className='col-12 px-0 pb-4'>  {/* Remove horizontal padding */}
                        <div
                            className={inCollection ? 'premium-content-border' : ''}
                            style={{
                                ...styles.descriptionStyle,
                                transform: isDescHovered && inCollection ? 'translateY(-3px)' : 'translateY(0)',
                                boxShadow: isDescHovered && inCollection
                                    ? (isDarkMode
                                        ? '0 10px 25px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)'
                                        : '0 10px 25px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.04)')
                                    : styles.descriptionStyle.boxShadow
                            }}
                            onMouseEnter={() => setIsDescHovered(true)}
                            onMouseLeave={() => setIsDescHovered(false)}
                        >
                            {inCollection && (
                                <div style={{
                                    width: isDescHovered ? '60px' : '40px',
                                    height: '5px',
                                    background: `linear-gradient(to right, ${currentTheme.accent}, transparent)`,
                                    borderRadius: '3px',
                                    marginBottom: '15px',
                                    transition: 'width 0.3s ease'
                                }}></div>
                            )}

                            {inCollection && (
                                <div style={{
                                    position: 'absolute',
                                    top: '15px',
                                    right: '15px',
                                    opacity: 0.15,
                                    transform: isDescHovered ? 'scale(1.1)' : 'scale(1)',
                                    transition: 'transform 0.3s ease'
                                }}>
                                    <FaQuoteLeft size={20} color={isDarkMode ? '#ffffff' : '#000000'} />
                                </div>
                            )}

                            <div style={{
                                ...styles.descriptionTextStyle,
                                textAlign: isArabicText(product.description) ? 'right' : 'left',
                                direction: isArabicText(product.description) ? 'rtl' : 'ltr'
                            }}>
                                {parsedDescription.map((part, index) =>
                                    part.type === 'text' ?
                                        renderTextWithParagraphs(part.content, isDarkMode, isMobile) :
                                        <a
                                            key={index}
                                            href={part.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                color: currentTheme.accent,
                                                textDecoration: 'none',
                                                fontWeight: '600',
                                                borderBottom: `2px solid ${currentTheme.accent}`,
                                                padding: '0 2px 1px 2px',
                                            }}
                                        >
                                            {part.text}
                                        </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {product.youtubeVideo && (
                <Suspense fallback={<div style={{ padding: '20px' }}><Loader /></div>}>
                    <VideoSection
                        product={product}
                        isDarkMode={isDarkMode}
                        inCollection={inCollection}
                        productId={product._id}
                    />
                </Suspense>
            )}

            {/* Exercise Tracking Section */}
            {collectionId !== '68018454d69602b329f916d6' && !product?.isMealDiet && !product?.isViewOnly && (
                <div id="exercise-tracking-section" className="exercise-tracking-section" style={exerciseStyles.section}>
                    <div
                        className="tracking-header"
                        style={exerciseStyles.header}
                        onClick={toggleWorkoutSection}
                    >
                        <div style={{...styles.trackingTitle, color: currentTheme.text}}>
                            <div className="exercise-icon-container" style={exerciseStyles.icon}>
                                <FaDumbbell 
                                    size={isMobile ? 14 : 18} 
                                    style={{ 
                                        color: currentTheme.accent,
                                        opacity: workoutSectionExpanded ? 1 : 0.9,
                                    }} 
                                />
                            </div>
                            Exercise Tracking
                        </div>

                        <Button
                            variant="link"
                            className="d-flex align-items-center"
                            style={exerciseStyles.button}
                            onClick={toggleWorkoutSection}
                        >
                            {workoutSectionExpanded ? (
                                <>Collapse <FaArrowUp size={11} /></>
                            ) : (
                                <>Log Exercise <FaPlus size={11} /></>
                            )}
                        </Button>
                    </div>

                    {workoutSectionExpanded && (
                        <Suspense fallback={<div style={exerciseStyles.formContainer}><Loader /></div>}>
                            <div style={exerciseStyles.formContainer}>
                                <WorkoutEntryForm
                                    productId={effectiveProductId}
                                    collectionId={collectionId}
                                    entryToEdit={entryToEdit}
                                    onEntryAdded={handleWorkoutSuccess}
                                    compact={true}
                                    isDarkMode={isDarkMode}
                                />
                            </div>
                        </Suspense>
                    )}
                </div>
            )}

            {/* Diet Entry Section */}
            {product?.isMealDiet && (
                <div id="meal-tracking-section" className="meal-tracking-section" style={mealStyles.section}>
                    <div
                        className="tracking-header"
                        style={mealStyles.header}
                        onClick={toggleDietSection}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <div className="meal-icon-container" style={mealStyles.icon}>
                                <FaUtensils 
                                    size={18}
                                    style={{ 
                                        color: activeMealColors.primary,
                                        opacity: dietSectionExpanded ? 1 : 0.9,
                                    }} 
                                />
                            </div>
                            <span style={{ 
                                color: currentTheme.text, 
                                fontWeight: '500',
                                transition: 'color 0.3s ease'
                            }}>Meal Tracking</span>
                        </div>

                        <Button
                            variant="link"
                            className="d-flex align-items-center"
                            style={mealStyles.button}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleDietSection();
                            }}
                        >
                            {dietSectionExpanded ? (
                                <>Collapse <FaArrowUp size={11} /></>
                            ) : (
                                <>Log Meal <FaPlus size={11} /></>
                            )}
                        </Button>
                    </div>

                    {dietSectionExpanded && (
                        <div style={mealStyles.formContainer}>
                            <Suspense fallback={<Loader />}>
                                <DietEntryForm
                                    product={product}
                                    collectionId={collectionId}
                                    onSuccess={handleDietSuccess}
                                    isDarkMode={isDarkMode}
                                />
                            </Suspense>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fade-in {
                    animation: fadeIn 0.5s ease forwards;
                }
                .invisible {
                    opacity: 0;
                }
                body.dark-mode {
                    background-color: #000000;
                }
                
                .dark-mode .product-main-image:hover {
                    box-shadow: 0 0 20px rgba(${parseInt(accentColor.slice(1, 3), 16)}, ${parseInt(accentColor.slice(3, 5), 16)}, ${parseInt(accentColor.slice(5, 7), 16)}, 0.3) !important;
                }
            `}</style>
        </div>
    );
};

// Export the memoized component
const MemoizedProductContent = React.memo(ProductContent);
export default MemoizedProductContent;