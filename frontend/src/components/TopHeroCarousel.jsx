import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { FaArrowRight } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { useGetCarouselSlidesQuery, useGetCarouselSettingsQuery } from '../slices/systemApiSlice';
import { useHeroImageCache } from '../utils/heroImageCacheRobust';
import '../assets/styles/hero-carousel-loading.css';

const carouselConfig = {
    transitionDuration: 200, // Reduced from 250ms for snappier response
    dragThreshold: 0.12,
    autoPlayInterval: 5000,
};

const TopHeroCarousel = memo(() => {
    const { userInfo } = useSelector((state) => state.auth);

    // Hero image cache integration with robust error handling
    const { isReady: cacheReady, cacheStats, preloadImages } = useHeroImageCache();

    // Fetch system carousel slides and settings with instant display
    const { data: systemCarouselSlides, error: carouselError } = useGetCarouselSlidesQuery(undefined, {
        refetchOnMountOrArgChange: false,
        refetchOnFocus: false,
        refetchOnReconnect: false,
        keepUnusedDataFor: 300 // 5 minute cache
    });
    const { data: carouselSettings } = useGetCarouselSettingsQuery(undefined, {
        refetchOnMountOrArgChange: false,
        refetchOnFocus: false,
        refetchOnReconnect: false,
        keepUnusedDataFor: 300 // 5 minute cache
    });

    // State hooks - optimized for fast initial display
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );
    const [isVisible, setIsVisible] = useState(true); // Show immediately, don't wait
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragDelta, setDragDelta] = useState(0);
    const [dragVelocity, setDragVelocity] = useState(0);
    const [imagesLoaded, setImagesLoaded] = useState(new Set()); // Track loaded images
    const carouselRef = useRef(null);
    const dragTimeRef = useRef(null);
    const dragPrevXRef = useRef({ x: 0, y: 0 });
    const autoPlayRef = useRef(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Check if admin has configured valid slides
    const hasValidSystemSlides = systemCarouselSlides?.length > 0 &&
        systemCarouselSlides.every(slide => slide.image && slide.link && slide.alt);

    // Use admin slides with proper format (only if valid slides exist)
    const slides = hasValidSystemSlides ? systemCarouselSlides.map(slide => ({
        ...slide,
        isExternal: Boolean(slide.isExternal)
    })) : [];

    // Immediate image preloading for faster display
    const preloadImagesImmediately = useCallback(async (imageUrls) => {
        if (!imageUrls || imageUrls.length === 0) return;
        
        const promises = imageUrls.map(url => {
            if (imagesLoaded.has(url)) return Promise.resolve();
            
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    setImagesLoaded(prev => new Set(prev).add(url));
                    resolve();
                };
                img.onerror = () => resolve(); // Don't fail on error
                img.src = url;
            });
        });
        
        await Promise.allSettled(promises);
    }, [imagesLoaded]);

    // Memoized autoplay function
    const startAutoPlay = useCallback(() => {
        if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        if (slides.length > 1) {
            const autoPlayInterval = carouselSettings?.autoPlayInterval || carouselConfig.autoPlayInterval;
            autoPlayRef.current = setInterval(() => {
                setCurrentSlide(prev => {
                    const newSlide = prev + 1;
                    return newSlide >= slides.length ? 0 : newSlide;
                });
            }, autoPlayInterval);
        }
    }, [slides.length, carouselSettings?.autoPlayInterval]);

    // Reset current slide when slides change
    useEffect(() => {
        if (hasValidSystemSlides) {
            setCurrentSlide(0);
        }
    }, [systemCarouselSlides, hasValidSystemSlides]);

    // Immediate image preloading for faster display
    useEffect(() => {
        if (!hasValidSystemSlides || slides.length === 0) return;
        
        // Prioritize first slide image for immediate display
        const firstSlideImage = slides[0]?.image;
        const firstSlideMobileImage = slides[0]?.mobileImage;
        
        if (firstSlideImage) {
            preloadImagesImmediately([firstSlideImage, firstSlideMobileImage].filter(Boolean));
        }
        
        // Then preload remaining images
        const allImageUrls = [];
        slides.forEach(slide => {
            if (slide.image && typeof slide.image === 'string') allImageUrls.push(slide.image);
            if (slide.mobileImage && typeof slide.mobileImage === 'string') allImageUrls.push(slide.mobileImage);
        });
        
        // Preload remaining images with slight delay to prioritize first image
        setTimeout(() => {
            if (cacheReady && allImageUrls.length > 0) {
                preloadImages(allImageUrls).catch(error => {
                    console.warn('TopHeroCarousel: Hero image preloading failed:', error);
                });
            }
        }, 50); // Very short delay to prioritize first image
        
    }, [hasValidSystemSlides, slides, preloadImagesImmediately, cacheReady, preloadImages]);

    // Optimized autoplay and theme detection
    useEffect(() => {
        if (!hasValidSystemSlides || slides.length === 0) return;

        // Start autoplay immediately without waiting
        startAutoPlay();

        // Optimized theme observer
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.attributeName === 'data-theme') {
                    setIsDarkMode(
                        document.documentElement.getAttribute('data-theme') === 'dark'
                    );
                    break;
                }
            }
        });
        observer.observe(document.documentElement, { 
            attributes: true,
            attributeFilter: ['data-theme'] 
        });

        // Debounced resize handler
        let resizeTimeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                setIsMobile(window.innerWidth <= 768);
            }, 100); // Reduced from 150ms
        };

        window.addEventListener('resize', handleResize);

        return () => {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
            observer.disconnect();
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimeout);
        };
    }, [hasValidSystemSlides, slides.length, startAutoPlay]);

    // Restart autoplay when settings change
    useEffect(() => {
        if (hasValidSystemSlides && isVisible && carouselSettings) {
            console.log('Restarting autoplay due to settings change:', carouselSettings);
            startAutoPlay();
        }
    }, [carouselSettings?.autoPlayInterval, carouselSettings?.transitionDuration, hasValidSystemSlides, isVisible, startAutoPlay]);

    // Show carousel immediately - no loading states
    if (carouselError || !hasValidSystemSlides) {
        return null;
    }

    console.log("Using admin slides:", slides);

    const handleDragStart = (clientX) => {
        setIsDragging(true);
        setDragStartX(clientX);
        dragPrevXRef.current = { x: clientX, y: 0 };
        dragTimeRef.current = Date.now();
        setDragVelocity(0);
        if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        if (carouselRef.current) {
            carouselRef.current.style.cursor = 'grabbing';
        }
    };

    const handleDragMove = (clientX) => {
        if (!isDragging) return;

        const deltaX = clientX - dragStartX;
        const currentTime = Date.now();
        const timeDelta = currentTime - dragTimeRef.current;
        const currentVelocity = (clientX - dragPrevXRef.current.x) / timeDelta;

        setDragDelta(deltaX);
        setDragVelocity(currentVelocity);

        dragPrevXRef.current = { x: clientX, y: dragPrevXRef.current.y };
        dragTimeRef.current = currentTime;
    };

    const handleDragEnd = () => {
        if (!isDragging) return;

        const containerWidth = carouselRef.current?.offsetWidth || 0;
        const dragPercentage = dragDelta / containerWidth;
        const velocityThreshold = 0.5;
        const shouldSlide = Math.abs(dragPercentage) > carouselConfig.dragThreshold ||
            Math.abs(dragVelocity) > velocityThreshold;

        if (shouldSlide) {
            if (dragDelta > 0 || dragVelocity > velocityThreshold) {
                // Move to previous slide with proper looping
                setCurrentSlide(prev => {
                    const newSlide = prev - 1;
                    return newSlide < 0 ? slides.length - 1 : newSlide;
                });
            } else if (dragDelta < 0 || dragVelocity < -velocityThreshold) {
                // Move to next slide with proper looping
                setCurrentSlide(prev => {
                    const newSlide = prev + 1;
                    return newSlide >= slides.length ? 0 : newSlide;
                });
            }
        }

        setIsDragging(false);
        setDragDelta(0);
        setDragVelocity(0);
        setDragStartX(0);

        if (carouselRef.current) {
            carouselRef.current.style.cursor = 'grab';
        }
        startAutoPlay();
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        handleDragStart(e.clientX);
    };

    const handleMouseMove = (e) => {
        e.preventDefault();
        handleDragMove(e.clientX);
    };

    const handleMouseUp = () => {
        handleDragEnd();
    };

    const handleTouchStart = (e) => {
        // Store the initial touch position
        setDragStartX(e.touches[0].clientX);
        const touchStartY = e.touches[0].clientY;
        dragPrevXRef.current = { x: e.touches[0].clientX, y: touchStartY };
        dragTimeRef.current = Date.now();
        setDragVelocity(0);

        // Don't immediately set isDragging - wait to see if it's horizontal
        if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };

    const handleTouchMove = (e) => {
        if (!dragStartX) return;

        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const deltaX = touchX - dragStartX;
        const deltaY = touchY - dragPrevXRef.current.y;

        // If vertical scrolling is more significant than horizontal, don't treat as carousel drag
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
            // User is trying to scroll vertically - don't interfere
            return;
        }

        // Only if we're actually dragging horizontally and the movement is significant
        if (Math.abs(deltaX) > 15) {
            // Only prevent default for horizontal swipes to allow vertical scrolling
            e.preventDefault();
            setIsDragging(true);

            const currentTime = Date.now();
            const timeDelta = currentTime - dragTimeRef.current;
            const currentVelocity = (touchX - dragPrevXRef.current.x) / timeDelta;

            setDragDelta(deltaX);
            setDragVelocity(currentVelocity);

            dragPrevXRef.current = { x: touchX, y: touchY };
            dragTimeRef.current = currentTime;

            if (carouselRef.current) {
                carouselRef.current.style.cursor = 'grabbing';
            }
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging) {
            // Reset everything if we weren't actually dragging
            setDragStartX(0);
            startAutoPlay();
            return;
        }

        const containerWidth = carouselRef.current?.offsetWidth || 0;
        const dragPercentage = dragDelta / containerWidth;
        const velocityThreshold = 0.5;
        const shouldSlide = Math.abs(dragPercentage) > carouselConfig.dragThreshold ||
            Math.abs(dragVelocity) > velocityThreshold;

        if (shouldSlide) {
            if (dragDelta > 0 || dragVelocity > velocityThreshold) {
                // Move to previous slide with proper looping
                setCurrentSlide(prev => {
                    const newSlide = prev - 1;
                    return newSlide < 0 ? slides.length - 1 : newSlide;
                });
            } else if (dragDelta < 0 || dragVelocity < -velocityThreshold) {
                // Move to next slide with proper looping
                setCurrentSlide(prev => {
                    const newSlide = prev + 1;
                    return newSlide >= slides.length ? 0 : newSlide;
                });
            }
        }

        setIsDragging(false);
        setDragDelta(0);
        setDragVelocity(0);
        setDragStartX(0);

        if (carouselRef.current) {
            carouselRef.current.style.cursor = 'grab';
        }
        startAutoPlay();
    };

    const handleLinkClick = (e, link, isExternal) => {
        e.preventDefault();
        e.stopPropagation();

        console.log("Link clicked:", link, "External:", isExternal);

        if (isDragging) {
            return;
        }

        if (isExternal) {
            // Ensure URL has proper protocol
            let url = link;
            if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            console.log("Opening external URL:", url);
            window.open(url, '_blank', 'noopener');
        } else {
            // For internal links, make sure they start with a slash
            let path = link;
            if (path && !path.startsWith('/')) {
                path = '/' + path;
            }
            console.log("Navigating to internal path:", path);
            window.location.href = path;
        }
    };

    const handleButtonTouch = (e, link) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isDragging) {
            // Ensure URL has proper protocol for external links
            let url = link;
            if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            console.log("Opening link from button touch:", url);
            window.open(url, '_blank', 'noopener');
        }
    };

    // Styles
    const styles = {
        container: {
            position: 'relative',
            width: '100%',
            height: isMobile ? 'min(70vh, 700px)' : 'min(600px, 50vw)',
            minHeight: isMobile ? '380px' : '350px',
            maxHeight: isMobile ? 'min(700px, 85vh)' : '600px',
            overflow: 'hidden',
            marginBottom: isMobile ? '1.5rem' : '2rem',
            marginTop: isMobile ? '1rem' : '2rem',
            marginLeft: 'auto',
            marginRight: 'auto',
            padding: isMobile ? '0 0.5rem' : '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            perspective: '2000px',
            cursor: 'grab',
            borderRadius: isMobile ? '16px' : '24px',
            touchAction: 'pan-y', // Allow vertical scrolling
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            boxShadow: isMobile
                ? (isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.6)' : '0 8px 32px rgba(0, 0, 0, 0.15)')
                : (isDarkMode ? '0 4px 16px rgba(0, 0, 0, 0.3)' : '0 4px 16px rgba(0, 0, 0, 0.1)'),
            '@media (max-width: 1200px)': {
                height: 'min(500px, 45vw)',
                aspectRatio: '16/11',
            },
            '@media (max-width: 768px)': {
                height: 'min(65vh, 650px)', // Limit to 650px on tablets/small screens
                minHeight: '380px',
                maxHeight: 'min(650px, 80vh)',
                borderRadius: '16px',
                marginTop: '1rem',
                marginBottom: '1.5rem',
                marginLeft: '0.25rem',
                marginRight: '0.25rem',
                boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.6)' : '0 8px 32px rgba(0, 0, 0, 0.15)',
            },
            '@media (max-width: 480px)': {
                height: 'min(60vh, 550px)', // Even more restrictive on small phones
                minHeight: '350px',
                maxHeight: 'min(550px, 70vh)',
                borderRadius: '12px',
                marginLeft: '0.5rem',
                marginRight: '0.5rem',
                marginTop: '1rem',
                marginBottom: '1.25rem',
            },
            '@media (max-width: 390px) and (min-height: 850px)': {
                // Very long narrow screens (like iPhone 14 Pro Max in portrait)
                height: 'min(55vh, 500px)',
                maxHeight: '500px',
                minHeight: '320px',
            }
        },
        carouselContainer: {
            position: 'relative',
            width: '100%',
            height: '100%',
            userSelect: 'none',
            borderRadius: 'inherit',
            overflow: 'hidden',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            // Remove 3D transforms to prevent artifacts
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            WebkitTransform: 'translateZ(0)',
            transform: 'translateZ(0)',
        },
        slide: {
            position: 'absolute',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            borderRadius: 'inherit',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            // Eliminate visual artifacts
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            WebkitTapHighlightColor: 'transparent',
            // Fix white shadows/artifacts
            isolation: 'isolate',
            contain: 'layout style paint',
        },
        imageContainer: {
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            borderRadius: 'inherit',
            background: isDarkMode ? '#0a0a0a' : '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        image: {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
            maxHeight: '80vh', // Limit height on tall screens
            transform: isVisible ? 'scale(1)' : 'scale(1.03)', // Faster, more subtle zoom
            transition: 'transform 1.2s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.4s ease-out',
            opacity: isVisible ? 1 : 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            imageRendering: '-webkit-optimize-contrast',
            WebkitImageRendering: '-webkit-optimize-contrast',
            // Eliminate image artifacts
            WebkitBackfaceVisibility: 'hidden',
        },
        linkButton: {
            position: 'relative',
            width: isMobile ? '48px' : '40px',
            height: isMobile ? '48px' : '40px',
            background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            backdropFilter: 'blur(10px) saturate(1.2)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.2)'}`,
            borderRadius: '50%',
            cursor: 'pointer',
            zIndex: 2,
            transform: 'translateZ(0)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDarkMode ? '#fff' : '#000',
            boxShadow: isDarkMode ? '0 4px 15px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.1)',
            textDecoration: 'none',
            outline: 'none',
            fontSize: isMobile ? '18px' : '16px',
            fontWeight: isMobile ? '600' : '500',
            '&:hover': {
                transform: 'scale(1.1)',
                background: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
            },
        },
        buttonWrapper: {
            pointerEvents: 'auto',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        dotsWrapper: {
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            pointerEvents: 'auto',
            '@media (max-width: 768px)': {
                gap: '8px',
            }
        },
        dot: {
            width: isMobile ? '8px' : '6px',
            height: isMobile ? '8px' : '6px',
            borderRadius: '50%',
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        },
        dotActive: {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 1)',
            transform: 'scale(1.2)',
            border: isDarkMode ? 'none' : `1px solid rgba(0,0,0,0.5)`,
        },
        bottomBar: {
            position: 'absolute',
            bottom: isMobile ? '16px' : '20px',
            left: isMobile ? '16px' : '25px',
            right: isMobile ? '16px' : '25px',
            zIndex: 1002,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pointerEvents: 'none',
            transition: 'bottom 0.3s ease',
        },
    };

    return (
        <div
            className="top-hero-carousel"
            style={styles.container}
            ref={carouselRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div style={styles.carouselContainer}>
                {slides.map((slide, index) => {
                    // Calculate the shortest distance between current slide and this slide
                    const totalSlides = slides.length;
                    let distance = index - currentSlide;

                    // Handle infinite looping by taking the shortest path
                    if (distance > totalSlides / 2) {
                        distance = distance - totalSlides;
                    } else if (distance < -totalSlides / 2) {
                        distance = distance + totalSlides;
                    }

                    const dragOffset = isDragging ? dragDelta / carouselRef.current?.offsetWidth * 100 : 0;
                    const isActive = index === currentSlide;
                    const absDistance = Math.abs(distance);

                    // Only render the current slide to prevent background slide artifacts
                    // During transitions, only show the current slide (no adjacent slides visible)
                    const shouldRender = isActive;
                    if (!shouldRender) return null;

                    // Simple transform for current slide only - no 3D effects to prevent artifacts
                    const simpleTransform = `translate3d(0, 0, 0)`;
                    
                    // Dynamic transition duration from settings
                    const transitionDuration = carouselSettings?.transitionDuration || carouselConfig.transitionDuration;

                    const slideStyles = {
                        ...styles.slide,
                        transform: simpleTransform,
                        opacity: 1,
                        zIndex: 100,
                        // Apply smooth transition using settings
                        transition: `opacity ${transitionDuration}ms ease-out, transform ${transitionDuration}ms ease-out`,
                        WebkitTransform: simpleTransform,
                        WebkitFilter: 'blur(0)',
                        filter: 'none',
                    };

                    return (
                        <div key={index} style={slideStyles}>
                            <div style={styles.imageContainer}>
                                {(() => {
                                    // Determine which image to use
                                    const imageToUse = isMobile && slide.mobileImage ? slide.mobileImage : slide.image;

                                    // Determine display mode for mobile
                                    const shouldFitImage = isMobile && slide.mobileDisplayMode === 'fit';

                                    if (shouldFitImage) {
                                        // For fit mode, maximize image size while preventing distortion
                                        const fitContainerStyles = {
                                            position: 'absolute',
                                            top: '1px',
                                            left: '1px',
                                            right: '1px',
                                            bottom: '1px',
                                            borderRadius: 'inherit',
                                            background: isDarkMode
                                                ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)'
                                                : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #e9ecef 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '2px', // Minimal padding for maximum space usage
                                        };

                                        const fitImageStyles = {
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            width: 'auto',
                                            height: 'auto',
                                            objectFit: 'contain',
                                            objectPosition: 'center',
                                            borderRadius: '4px',
                                            boxShadow: isDarkMode
                                                ? '0 6px 25px rgba(0,0,0,0.6)'
                                                : '0 6px 25px rgba(0,0,0,0.12)',
                                            transition: 'transform 1.8s cubic-bezier(0.25, 0.1, 0.25, 1)',
                                            transform: Math.abs(distance) === 0 ? 'scale(1.01)' : 'scale(1)',
                                            // Smart sizing to use maximum available space
                                            minWidth: '95%',
                                            minHeight: '95%',
                                            // Anti-aliasing and rendering optimizations
                                            backfaceVisibility: 'hidden',
                                            WebkitBackfaceVisibility: 'hidden',
                                            WebkitFontSmoothing: 'antialiased',
                                            WebkitOptimizeContrast: 'optimize',
                                            imageRendering: '-webkit-optimize-contrast',
                                            // Eliminate white lines and cursor artifacts
                                            display: 'block',
                                            outline: 'none',
                                            border: 'none',
                                            verticalAlign: 'top',
                                            // Fix potential rendering issues
                                            contain: 'layout style paint',
                                            isolation: 'isolate',
                                        };

                                        return (
                                            <div style={fitContainerStyles}>
                                                <img
                                                    src={imageToUse}
                                                    alt={slide.alt || "Carousel image"}
                                                    style={fitImageStyles}
                                                    draggable={false}
                                                    loading={index === 0 || Math.abs(distance) <= 1 ? "eager" : "lazy"}
                                                    decoding={index === 0 ? "sync" : "async"}
                                                    fetchPriority={index === 0 ? "high" : "low"}
                                                    onLoad={() => {
                                                        // Image loaded successfully - cached for future use
                                                        if (distance === 0) {
                                                            console.log(`Hero image loaded: ${imageToUse}`);
                                                        }
                                                    }}
                                                    onError={(e) => {
                                                        console.warn(`Hero image load failed: ${imageToUse}`);
                                                        // Fallback to a default or retry logic could be added here
                                                    }}
                                                    // Preload first image
                                                    {...(index === 0 && { 
                                                        onLoadStart: () => console.log('First hero image loading started'),
                                                        style: { ...fitImageStyles, willChange: 'transform' }
                                                    })}
                                                />
                                            </div>
                                        );
                                    } else {
                                        // For crop mode, use optimized cover mode with artifact prevention
                                        const cropImageStyles = {
                                            ...styles.image,
                                            objectFit: 'cover',
                                            objectPosition: 'center',
                                            maxHeight: '80vh', // Limit height on tall screens
                                            // Enhanced anti-aliasing and performance
                                            backfaceVisibility: 'hidden',
                                            WebkitBackfaceVisibility: 'hidden',
                                            WebkitFontSmoothing: 'antialiased',
                                            WebkitOptimizeContrast: 'optimize',
                                            imageRendering: '-webkit-optimize-contrast',
                                            // Eliminate white lines, cursor artifacts, and edge bleeding
                                            display: 'block',
                                            outline: 'none',
                                            border: 'none',
                                            verticalAlign: 'top',
                                            // Extend image slightly beyond container to prevent edge artifacts
                                            transform: `scale(${isVisible ? '1.001' : '1.03'})`,
                                            transition: 'transform 1.2s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.4s ease-out',
                                            // Enhanced color and contrast
                                            filter: 'contrast(1.01) saturate(1.03)',
                                            // Fix rendering glitches
                                            contain: 'layout style paint',
                                            isolation: 'isolate',
                                            // Prevent sub-pixel rendering issues
                                            WebkitTransform: `translateZ(0) scale(${isVisible ? '1.001' : '1.03'})`,
                                        };

                                        return (
                                            <img
                                                src={imageToUse}
                                                alt={slide.alt || "Carousel image"}
                                                style={cropImageStyles}
                                                draggable={false}
                                                loading={Math.abs(distance) <= 1 ? "eager" : "lazy"}
                                                decoding="async"
                                                onLoad={() => {
                                                    // Image loaded successfully - cached for future use
                                                    if (distance === 0) {
                                                        console.log(`Hero image loaded: ${imageToUse}`);
                                                    }
                                                }}
                                                onError={(e) => {
                                                    console.warn(`Hero image load failed: ${imageToUse}`);
                                                    // Fallback to a default or retry logic could be added here
                                                }}
                                            />
                                        );
                                    }
                                })()}
                                <div style={styles.bottomBar}>
                                    <div style={styles.dotsWrapper}>
                                        {slides.map((_, dotIndex) => (
                                            <button
                                                key={dotIndex}
                                                style={{
                                                    ...styles.dot,
                                                    ...(currentSlide === dotIndex ? styles.dotActive : {})
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
                                                    setCurrentSlide(dotIndex);
                                                    startAutoPlay();
                                                }}
                                                aria-label={`Go to slide ${dotIndex + 1}`}
                                            />
                                        ))}
                                    </div>
                                    <div style={styles.buttonWrapper}>
                                        {/* Use a unified approach for both internal and external links */}
                                        {slide.isExternal ? (
                                            <a
                                                href={slide.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={styles.linkButton}
                                                onClick={(e) => handleLinkClick(e, slide.link, true)}
                                                onMouseDown={(e) => e.stopPropagation()} // Prevent drag
                                                onTouchStart={(e) => e.stopPropagation()}
                                            >
                                                <FaExternalLinkAlt />
                                            </a>
                                        ) : (
                                            <Link
                                                to={slide.link}
                                                style={styles.linkButton}
                                                onClick={(e) => handleLinkClick(e, slide.link, false)}
                                                onMouseDown={(e) => e.stopPropagation()} // Prevent drag
                                                onTouchStart={(e) => e.stopPropagation()}
                                            >
                                                <FaArrowRight />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

export default TopHeroCarousel; 