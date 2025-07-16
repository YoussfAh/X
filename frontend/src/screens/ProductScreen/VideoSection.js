import { useState, useEffect, useRef, memo, lazy, Suspense } from 'react';
import { FaPlay, FaYoutube, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

// Memoize the component to prevent unnecessary re-renders
const VideoSection = memo(({ product, isDarkMode, inCollection, productId }) => {
    const videoRef = useRef(null);
    const videoContainerRef = useRef(null);
    const youtubePlayerRef = useRef(null);
    const youtubeApiLoadedRef = useRef(false);
    const ytApiLoadAttemptedRef = useRef(false);
    const thumbnailLoadTimeoutRef = useRef(null);
    const earlyClickIntentRef = useRef(false);
    const playerInitTimeoutRef = useRef(null);
    const playAttemptTimeoutRef = useRef(null);
    const intersectionObserverRef = useRef(null);

    const [videoPlaying, setVideoPlaying] = useState(false);
    const [playerReady, setPlayerReady] = useState(false);
    const [isVideoLoading, setIsVideoLoading] = useState(true);
    const [videoError, setVideoError] = useState(false);
    const [videoId, setVideoId] = useState(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isShort, setIsShort] = useState(false);
    const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [isInViewport, setIsInViewport] = useState(false);

    // AMOLED friendly colors to match ProductContent.js
    const colors = {
        accent: '#9d4edd',
        secondaryAccent: '#7b2cbf',
        trueBlack: '#000000',
        deepDark: 'rgba(5, 5, 10, 0.95)'
    };

    // Load YouTube API only when video section is in viewport
    useEffect(() => {
        if (!videoContainerRef.current) return;

        const options = {
            root: null,
            rootMargin: '100px', // Start loading slightly before the video comes into view
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setIsInViewport(true);
                    observer.disconnect();
                }
            });
        }, options);

        observer.observe(videoContainerRef.current);
        intersectionObserverRef.current = observer;

        return () => {
            if (intersectionObserverRef.current) {
                intersectionObserverRef.current.disconnect();
            }
        };
    }, []);

    // Load YouTube API more efficiently with better error handling
    useEffect(() => {
        if (!isInViewport || ytApiLoadAttemptedRef.current) return;
        ytApiLoadAttemptedRef.current = true;

        // Check if API is already loaded globally
        if (window.YT && window.YT.Player) {
            youtubeApiLoadedRef.current = true;
            return;
        }

        // Create a specific callback function for this component instance
        const callbackName = `onYouTubeIframeAPIReady_${productId}`;

        // Store the original callback if it exists
        const originalCallback = window.onYouTubeIframeAPIReady;

        // Define the new callback
        window[callbackName] = () => {
            youtubeApiLoadedRef.current = true;
            if (typeof originalCallback === 'function') {
                originalCallback();
            }

            if (videoId) {
                requestAnimationFrame(() => {
                    initializeYouTubePlayer(videoId);
                    if (earlyClickIntentRef.current) {
                        attemptToPlayVideo();
                    }
                });
            }
        };

        window.onYouTubeIframeAPIReady = window[callbackName];

        // Load the API script
        try {
            const existingScript = document.getElementById('youtube-api-script');
            if (!existingScript) {
                const tag = document.createElement('script');
                tag.id = 'youtube-api-script';
                tag.src = 'https://www.youtube.com/iframe_api';
                tag.async = true;
                tag.defer = true;
                tag.onerror = () => {
                    console.error('Failed to load YouTube API');
                    setVideoError(true);
                    setIsVideoLoading(false);
                };

                document.head.appendChild(tag);
            }
        } catch (error) {
            console.error('Error loading YouTube API:', error);
            setVideoError(true);
            setIsVideoLoading(false);
        }

        return () => {
            if (window[callbackName]) {
                window.onYouTubeIframeAPIReady = originalCallback;
                delete window[callbackName];
            }

            if (youtubePlayerRef.current) {
                try {
                    youtubePlayerRef.current.destroy();
                } catch (e) {
                    console.log('Error destroying player during cleanup');
                }
                youtubePlayerRef.current = null;
            }

            Object.values(thumbnailLoadTimeoutRef).forEach(timeout => clearTimeout(timeout));
        };
    }, [isInViewport, productId, videoId]);

    // Handle window resize for responsive layout
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Improved video ID extraction with better error handling
    const extractVideoId = (url) => {
        if (!url) return null;

        try {
            let id = null;
            let isShortVideo = false;

            if (url.includes('shorts/')) {
                id = url.split('shorts/')[1]?.split(/[?#]/)[0];
                isShortVideo = true;
            } else if (url.includes('watch?v=')) {
                id = url.split('watch?v=')[1]?.split(/[&#]/)[0];
            } else if (url.includes('youtu.be/')) {
                id = url.split('youtu.be/')[1]?.split(/[?#]/)[0];
            } else if (url.includes('embed/')) {
                id = url.split('embed/')[1]?.split(/[?#]/)[0];
            }

            // Validate ID format - YouTube IDs are typically 11 characters
            if (id && id.length > 8) {
                setIsShort(isShortVideo);
                return id;
            }

            return null;
        } catch (error) {
            console.error('Error extracting video ID:', error);
            return null;
        }
    };

    // Faster thumbnail loading with optimized fallbacks
    const loadVideoThumbnails = (id) => {
        if (!id) return;

        // Try to load thumbnails in order of quality
        const thumbnailUrls = [
            `https://i.ytimg.com/vi_webp/${id}/maxresdefault.webp`, // First try WebP for faster loading
            `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
            `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
            `https://i.ytimg.com/vi/${id}/sddefault.jpg`,
            `https://i.ytimg.com/vi/${id}/default.jpg`
        ];

        let loadIndex = 0;

        const tryLoadingThumbnail = () => {
            if (loadIndex >= thumbnailUrls.length) {
                setIsVideoLoading(false);
                return;
            }

            const img = new Image();
            img.onload = () => {
                setThumbnailUrl(thumbnailUrls[loadIndex]);
                setThumbnailLoaded(true);
                setIsVideoLoading(false);
            };

            img.onerror = () => {
                loadIndex++;
                tryLoadingThumbnail();
            };

            img.src = thumbnailUrls[loadIndex];
        };

        // Start loading process
        tryLoadingThumbnail();

        // Set a shorter timeout as a safety net (reduced from 3000ms)
        thumbnailLoadTimeoutRef.current = setTimeout(() => {
            setIsVideoLoading(false);
        }, 2000);
    };

    // Attempt to play the video regardless of current player state
    const attemptToPlayVideo = () => {
        console.log('Attempting to play video', {
            playerExists: !!youtubePlayerRef.current,
            playerReady,
            videoId
        });

        // Clear any existing play attempt timeouts
        if (playAttemptTimeoutRef.current) {
            clearTimeout(playAttemptTimeoutRef.current);
        }

        // If player doesn't exist yet but we have a videoId, try to initialize it
        if (!youtubePlayerRef.current && videoId && window.YT && window.YT.Player) {
            initializeYouTubePlayer(videoId);
            playAttemptTimeoutRef.current = setTimeout(attemptToPlayVideo, 300);
            return;
        }

        // If player exists but isn't ready yet, set a polling interval to check
        if (youtubePlayerRef.current && !playerReady) {
            // Short polling interval to check if player becomes ready
            const checkInterval = setInterval(() => {
                if (youtubePlayerRef.current && playerReady) {
                    clearInterval(checkInterval);
                    try {
                        youtubePlayerRef.current.playVideo();
                        setVideoPlaying(true);
                    } catch (error) {
                        console.error('Error playing in interval:', error);
                    }
                }
            }, 100);

            // Safety timeout to clear interval
            setTimeout(() => clearInterval(checkInterval), 5000);
            return;
        }

        // If player exists and is ready, play it
        if (youtubePlayerRef.current && playerReady) {
            try {
                youtubePlayerRef.current.playVideo();
                if (!isMuted) {
                    youtubePlayerRef.current.unMute();
                }
                setVideoPlaying(true);
                return true;
            } catch (error) {
                console.error('Error playing video:', error);
                return false;
            }
        }

        return false;
    };

    // Process YouTube video URL when product changes
    useEffect(() => {
        // Reset early click intent with each new video
        earlyClickIntentRef.current = false;

        // Clear any existing timeouts
        if (thumbnailLoadTimeoutRef.current) {
            clearTimeout(thumbnailLoadTimeoutRef.current);
        }
        if (playerInitTimeoutRef.current) {
            clearTimeout(playerInitTimeoutRef.current);
        }
        if (playAttemptTimeoutRef.current) {
            clearTimeout(playAttemptTimeoutRef.current);
        }

        setIsVideoLoading(true);
        setVideoError(false);
        setThumbnailLoaded(false);
        setThumbnailUrl('');

        if (product?.youtubeVideo) {
            const id = extractVideoId(product.youtubeVideo);

            if (id) {
                setVideoId(id);
                loadVideoThumbnails(id);

                // Initialize player if API is already loaded
                if (youtubeApiLoadedRef.current && window.YT && window.YT.Player) {
                    // Add a slight delay to ensure DOM is ready
                    playerInitTimeoutRef.current = setTimeout(() => {
                        initializeYouTubePlayer(id);
                    }, 50);
                }
            } else {
                console.error('Invalid YouTube URL:', product.youtubeVideo);
                setVideoError(true);
                setIsVideoLoading(false);
            }
        } else {
            // No YouTube video URL provided
            setVideoError(true);
            setIsVideoLoading(false);
        }
    }, [product]);

    // Simplified video dimensions calculation
    const calculateVideoDimensions = () => {
        const screenWidth = window.innerWidth;
        const aspectRatio = isShort ? 9 / 16 : 16 / 9;

        let containerWidth, containerHeight;

        if (isShort) {
            // Shorts are usually vertical videos
            containerWidth = Math.min(screenWidth * 0.9, 450); // Cap width for shorts
            containerHeight = containerWidth / aspectRatio;

            // Ensure height isn't too tall
            const maxShortHeight = window.innerHeight * 0.65;
            containerHeight = Math.min(containerHeight, maxShortHeight);
        } else {
            // Regular videos
            containerWidth = Math.min(screenWidth * 0.96, 1200); // Limit max width
            containerHeight = containerWidth / aspectRatio;

            // Set a maximum height
            const maxHeight = window.innerHeight * (isMobile ? 0.5 : 0.6);
            if (containerHeight > maxHeight) {
                containerHeight = maxHeight;
                containerWidth = containerHeight * aspectRatio;
            }
        }

        return {
            width: Math.floor(containerWidth),
            height: Math.floor(containerHeight)
        };
    };

    const { width: videoWidth, height: videoHeight } = calculateVideoDimensions();

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (videoContainerRef.current) {
                const { width, height } = calculateVideoDimensions();
                videoContainerRef.current.style.width = `${width}px`;
                videoContainerRef.current.style.height = `${height}px`;
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isShort]);

    // Optimized YouTube Player initialization with robust DOM handling
    const initializeYouTubePlayer = (videoId) => {
        if (!videoId || !window.YT || !window.YT.Player) {
            console.error('YouTube API not loaded or invalid video ID');
            setVideoError(true);
            setIsVideoLoading(false);
            return;
        }

        // Clean up previous player if it exists
        if (youtubePlayerRef.current) {
            try {
                youtubePlayerRef.current.destroy();
                youtubePlayerRef.current = null;
            } catch (error) {
                console.log('Error cleaning up previous player');
            }
        }

        // Reset player state
        setPlayerReady(false);

        try {
            const playerId = inCollection ? `youtube-player-${productId}` : 'youtube-player';

            // Important: Make sure we recreate a fresh player container
            // This prevents the "Failed to execute 'insertBefore' on 'Node'" error
            const playerContainer = document.getElementById(playerId);

            if (!playerContainer) {
                console.error('Player element not found in DOM');
                setVideoError(true);
                setIsVideoLoading(false);
                return;
            }

            // Clear any existing content in the player container
            while (playerContainer.firstChild) {
                playerContainer.removeChild(playerContainer.firstChild);
            }

            // Create a new div that will actually host the iframe
            const iframeContainer = document.createElement('div');
            iframeContainer.id = `${playerId}-iframe-container`;
            iframeContainer.style.width = '100%';
            iframeContainer.style.height = '100%';
            iframeContainer.style.position = 'absolute';
            iframeContainer.style.top = '0';
            iframeContainer.style.left = '0';
            iframeContainer.style.zIndex = '3';
            iframeContainer.style.pointerEvents = 'all'; // Ensure clicks pass through
            playerContainer.appendChild(iframeContainer);

            // Configure for faster loading
            const preferredQuality = isMobile ? 'medium' : 'hd720';

            // Only load the actual player when the container is visible
            const playerOptions = {
                videoId: videoId,
                playerVars: {
                    playsinline: 1,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    fs: 1,
                    vq: preferredQuality,
                    iv_load_policy: 3,
                    disablekb: 0,
                    controls: 1,
                    showsearch: 0,
                    ecver: 2,
                    enablejsapi: 1,
                    origin: window.location.origin,
                    mute: 1,
                    cc_load_policy: 0,
                    cc_lang_pref: 'none',
                    hl: 'none',
                    loop: 1,
                    playlist: videoId,
                    widget_referrer: window.location.origin,
                    color: 'white',
                    autohide: 0,
                    wmode: 'transparent'
                },
                events: {
                    onReady: (event) => {
                        console.log('YouTube player ready');
                        setPlayerReady(true);
                        setIsVideoLoading(false);
                        try {
                            event.target.mute();

                            // Disable captions
                            if (event.target.getOptions && event.target.getOptions().includes('cc')) {
                                event.target.unloadModule('cc');
                                event.target.unloadModule('captions');
                            }

                            // For shorts, adjust playback rate
                            if (isShort) {
                                event.target.setPlaybackRate(0.9);
                            }

                            // If user had clicked earlier before player was ready, play now
                            if (earlyClickIntentRef.current) {
                                playAttemptTimeoutRef.current = setTimeout(() => {
                                    try {
                                        event.target.playVideo();
                                        setVideoPlaying(true);
                                    } catch (error) {
                                        console.error('Error auto-playing after ready:', error);
                                    }
                                }, 100);
                            }
                        } catch (error) {
                            console.error('Error configuring video:', error);
                        }
                    },
                    onStateChange: (event) => {
                        // Only update state if player still exists
                        if (youtubePlayerRef.current) {
                            if (event.data === window.YT.PlayerState.PLAYING) {
                                // Ensure the iframe is fully visible when playing
                                if (playerContainer) {
                                    playerContainer.style.opacity = '1';
                                    playerContainer.style.visibility = 'visible';

                                    // Force the iframe inside the player element to be visible
                                    const iframe = playerContainer.querySelector('iframe');
                                    if (iframe) {
                                        iframe.style.opacity = '1';
                                        iframe.style.visibility = 'visible';
                                        iframe.style.zIndex = '10';
                                        iframe.style.position = 'absolute';
                                        iframe.style.top = '0';
                                        iframe.style.left = '0';
                                        iframe.style.width = '100%';
                                        iframe.style.height = '100%';
                                    }
                                }
                                setVideoPlaying(true);
                            } else if (event.data === window.YT.PlayerState.PAUSED) {
                                setVideoPlaying(false);
                            } else if (event.data === window.YT.PlayerState.ENDED) {
                                // Loop video
                                if (youtubePlayerRef.current && playerReady) {
                                    youtubePlayerRef.current.seekTo(0);
                                    youtubePlayerRef.current.playVideo();
                                }
                            }
                        }
                    },
                    onError: (event) => {
                        console.error('YouTube player error code:', event.data);
                        // Try to recover by reloading the video with a different quality
                        try {
                            if (youtubePlayerRef.current && playerReady) {
                                youtubePlayerRef.current.setPlaybackQuality('default');
                                youtubePlayerRef.current.playVideo();
                            } else {
                                setVideoError(true);
                                setIsVideoLoading(false);
                            }
                        } catch (e) {
                            setVideoError(true);
                            setIsVideoLoading(false);
                        }
                    },
                }
            };

            // Create new player instance on the fresh container
            youtubePlayerRef.current = new window.YT.Player(`${playerId}-iframe-container`, playerOptions);

            // Set a shorter timeout to catch initialization issues - reduced from 3000ms to 2000ms for faster response
            setTimeout(() => {
                if (!playerReady && youtubePlayerRef.current) {
                    console.log('Forcing player ready state after timeout');
                    setPlayerReady(true);
                    setIsVideoLoading(false);

                    // Try to play if there was an early click intention
                    if (earlyClickIntentRef.current) {
                        attemptToPlayVideo();
                    }
                }
            }, 2000);
        } catch (error) {
            console.error('Error initializing YouTube player:', error);
            setVideoError(true);
            setIsVideoLoading(false);
        }
    };

    // Video playback control - improved for one-click play
    const handleVideoClick = (e) => {
        // Record that user wants to play the video, even if player isn't ready yet
        earlyClickIntentRef.current = true;

        // Make sure event propagation is stopped to handle the click properly
        e.stopPropagation();
        e.preventDefault();

        // If video is already playing, just pause it
        if (videoPlaying && youtubePlayerRef.current && playerReady) {
            try {
                youtubePlayerRef.current.pauseVideo();
                return;
            } catch (error) {
                console.error('Error pausing video:', error);
            }
        }

        // Try to play the video immediately
        const played = attemptToPlayVideo();

        // If the play attempt wasn't successful but the player is being created,
        // we've already flagged the intent and it will play when ready
        if (!played && !youtubePlayerRef.current && videoId) {
            // If API isn't loaded yet, start loading both API and player
            if (!window.YT || !window.YT.Player) {
                // Ensure thumbnail isn't blocking clicks
                setThumbnailLoaded(false);

                // Add an immediate visual feedback that something is happening
                setIsVideoLoading(true);

                // Set a timeout to initialize player when API loads
                setTimeout(() => {
                    if (videoId && window.YT && window.YT.Player) {
                        initializeYouTubePlayer(videoId);
                        setTimeout(attemptToPlayVideo, 300);
                    }
                }, 100);
            } else {
                // API is loaded but player needs initialization
                initializeYouTubePlayer(videoId);
                setTimeout(attemptToPlayVideo, 300);
            }
        }
    };

    // Toggle mute state
    const toggleMute = (e) => {
        e.stopPropagation();
        if (!youtubePlayerRef.current || !playerReady) return;

        try {
            if (isMuted) {
                youtubePlayerRef.current.unMute();
                setIsMuted(false);
            } else {
                youtubePlayerRef.current.mute();
                setIsMuted(true);
            }
        } catch (error) {
            console.error('Error toggling mute state:', error);
        }
    };

    // Pause video when scrolled out of view
    useEffect(() => {
        if (!videoContainerRef.current) return;

        const currentVideoContainer = videoContainerRef.current;
        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (!entry.isIntersecting && videoPlaying && youtubePlayerRef.current) {
                    try {
                        youtubePlayerRef.current.pauseVideo();
                    } catch (error) {
                        console.error('Error pausing video:', error);
                    }
                }
            },
            {
                root: null,
                rootMargin: '0px',
                threshold: 0.2,
            }
        );

        observer.observe(currentVideoContainer);
        return () => {
            if (currentVideoContainer) {
                observer.unobserve(currentVideoContainer);
            }
        };
    }, [videoPlaying]);

    // If there's an error and loading is complete, don't render the component
    if (videoError && !isVideoLoading) {
        return null;
    }

    // Modified YouTube player container CSS
    return (
        <div
            className='video-section fade-in'
            style={{
                width: '100%',
                backgroundColor: 'transparent',
                marginBottom: inCollection ? '1.5rem' : '0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: isMobile ? '0.5rem 0' : '1rem 0',
                borderRadius: '0',
                overflow: 'hidden'
            }}
        >
            <div style={{
                width: '100%',
                maxWidth: '100%',
                animation: 'fadeIn 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <h4
                    className="d-flex align-items-center mb-2"
                    style={{
                        color: isDarkMode ? '#fff' : '#1e293b',
                        fontWeight: '600',
                        fontSize: isMobile ? '1.1rem' : '1.2rem',
                        width: '100%',
                        textShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.5)' : 'none',
                        paddingLeft: '16px', // Added left padding as requested
                    }}
                >
                    <FaYoutube size={isMobile ? 18 : 22} color="#FF0000" className="me-1 " />
                    {isShort ? "YouTube Short" : "Video"}
                    <div style={{
                        height: '2px',
                        backgroundColor: colors.accent,
                        opacity: 0.5,
                        flexGrow: 1,
                        marginLeft: '12px',
                        boxShadow: isDarkMode ? `0 0 8px rgba(${parseInt(colors.accent.slice(1, 3), 16)}, ${parseInt(colors.accent.slice(3, 5), 16)}, ${parseInt(colors.accent.slice(5, 7), 16)}, 0.3)` : 'none',
                    }}></div>
                </h4>

                <div
                    ref={videoContainerRef}
                    className='position-relative video-container'
                    style={{
                        width: '100%',
                        maxWidth: `${videoWidth}px`,
                        height: `${videoHeight}px`,
                        margin: '0 auto',
                        backgroundColor: isDarkMode ? colors.trueBlack : 'rgba(241, 245, 249, 0.7)',
                        cursor: 'pointer',
                        boxShadow: isDarkMode
                            ? `0 10px 25px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(${parseInt(colors.accent.slice(1, 3), 16)}, ${parseInt(colors.accent.slice(3, 5), 16)}, ${parseInt(colors.accent.slice(5, 7), 16)}, 0.15)`
                            : '0 10px 25px rgba(0, 0, 0, 0.1)',
                        borderRadius: isShort ? '20px' : '16px',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        border: isDarkMode ? `1px solid rgba(${parseInt(colors.accent.slice(1, 3), 16)}, ${parseInt(colors.accent.slice(3, 5), 16)}, ${parseInt(colors.accent.slice(5, 7), 16)}, 0.2)` : 'none',
                        position: 'relative',
                    }}
                    onClick={handleVideoClick}
                >
                    {/* Thumbnail background that gets hidden when video plays */}
                    {!videoPlaying && thumbnailLoaded && (
                        <div
                            className="thumbnail-background"
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                backgroundImage: `url(${thumbnailUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                zIndex: 2,
                                cursor: 'pointer',
                            }}
                            onClick={handleVideoClick}
                        />
                    )}

                    {/* YouTube player container - Direct iframe wrapper */}
                    <div
                        id={inCollection ? `youtube-player-${productId}` : 'youtube-player'}
                        ref={videoRef}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: videoPlaying ? 4 : 1, // Higher z-index when playing
                        }}
                    ></div>

                    {/* Loading spinner */}
                    {isVideoLoading && (
                        <div
                            className='position-absolute d-flex align-items-center justify-content-center'
                            style={{
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.2)',
                                zIndex: 10,
                            }}
                        >
                            <div className="loading-spinner">
                                <div className="spinner-border" role="status" style={{ color: colors.accent }}>
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Volume control button */}
                    {playerReady && videoPlaying && (
                        <div
                            className="volume-control position-absolute"
                            style={{
                                bottom: '50px',
                                right: isMobile ? '15px' : '20px',
                                zIndex: 15,
                                backgroundColor: isDarkMode ? 'rgba(5, 5, 10, 0.8)' : 'rgba(0,0,0,0.6)',
                                borderRadius: '50%',
                                width: isMobile ? '36px' : '42px',
                                height: isMobile ? '36px' : '42px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: 0.9,
                                boxShadow: isDarkMode ?
                                    `0 3px 12px rgba(0,0,0,0.5), 0 0 0 1px rgba(${parseInt(colors.accent.slice(1, 3), 16)}, ${parseInt(colors.accent.slice(3, 5), 16)}, ${parseInt(colors.accent.slice(5, 7), 16)}, 0.3)` :
                                    '0 2px 10px rgba(0,0,0,0.3)',
                            }}
                            onClick={toggleMute}
                        >
                            {isMuted ? (
                                <FaVolumeMute color="#fff" size={isMobile ? 16 : 18} />
                            ) : (
                                <FaVolumeUp color="#fff" size={isMobile ? 16 : 18} />
                            )}
                        </div>
                    )}

                    {/* Play button overlay - only shown when not playing */}
                    {!videoPlaying && !isVideoLoading && (
                        <div
                            className='position-absolute d-flex align-items-center justify-content-center play-overlay'
                            style={{
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.4)',
                                zIndex: 5,
                                cursor: 'pointer',
                            }}
                            onClick={handleVideoClick}
                        >
                            <div
                                className='d-flex align-items-center justify-content-center play-button'
                                style={{
                                    width: isMobile ? '70px' : '100px',
                                    height: isMobile ? '70px' : '100px',
                                    opacity: 0.9,
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                    transform: 'scale(1)',
                                    borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${colors.accent}, ${colors.secondaryAccent})`,
                                    boxShadow: isDarkMode ?
                                        `0 0 30px rgba(${parseInt(colors.accent.slice(1, 3), 16)}, ${parseInt(colors.accent.slice(3, 5), 16)}, ${parseInt(colors.accent.slice(5, 7), 16)}, 0.6), 0 0 0 1px rgba(${parseInt(colors.accent.slice(1, 3), 16)}, ${parseInt(colors.accent.slice(3, 5), 16)}, ${parseInt(colors.accent.slice(5, 7), 16)}, 0.3)` :
                                        `0 0 30px rgba(${parseInt(colors.accent.slice(1, 3), 16)}, ${parseInt(colors.accent.slice(3, 5), 16)}, ${parseInt(colors.accent.slice(5, 7), 16)}, 0.6)`
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                <FaPlay color='white' size={isMobile ? 24 : 35} style={{ marginLeft: '6px' }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default VideoSection;