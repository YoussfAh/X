import React, { memo, useState, useEffect, useCallback } from 'react';

const VideoSection = memo(({ exercise, isDarkMode, inCollection, exerciseId }) => {
    const [videoId, setVideoId] = useState('');
    const [videoError, setVideoError] = useState(false);
    const [apiReady, setApiReady] = useState(false);
    const [player, setPlayer] = useState(null);
    const accentColor = '#9d4edd';
    const trueBlack = '#000000';

    // Extract video ID from YouTube URL
    const extractVideoId = useCallback((url) => {
        if (!url) return null;

        try {
            const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
            const match = url.match(regex);
            return match ? match[1] : null;
        } catch (error) {
            console.error('Error extracting video ID:', error);
            return null;
        }
    }, []);

    // Process YouTube video URL when exercise changes
    useEffect(() => {
        setVideoError(false);

        if (exercise?.youtubeVideo) {
            const id = extractVideoId(exercise.youtubeVideo);
            if (id) {
                setVideoId(id);
            } else {
                console.error('Invalid YouTube URL:', exercise.youtubeVideo);
                setVideoError(true);
            }
        } else {
            setVideoId('');
        }
    }, [exercise, extractVideoId]);

    const containerStyle = {
        backgroundColor: isDarkMode ? trueBlack : 'rgba(255, 255, 255, 0.9)',
        borderRadius: inCollection ? '0' : '24px',
        overflow: 'hidden',
        boxShadow: isDarkMode
            ? `0 10px 25px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(${parseInt(accentColor.slice(1, 3), 16)}, ${parseInt(accentColor.slice(3, 5), 16)}, ${parseInt(accentColor.slice(5, 7), 16)}, 0.15)`
            : '0 10px 25px rgba(0, 0, 0, 0.1)',
        border: inCollection ? 'none' : (isDarkMode ? '1px solid rgba(100, 50, 200, 0.2)' : '1px solid rgba(0, 0, 0, 0.04)'),
        width: '100%',
        marginBottom: inCollection ? '0' : '1.5rem',
        backdropFilter: 'blur(12px)',
        transition: 'all 0.3s ease',
        maxWidth: '100%',
        padding: '0',
    };

    const videoContainerStyle = {
        position: 'relative',
        paddingBottom: '56.25%', // 16:9 aspect ratio
        height: 0,
        overflow: 'hidden',
        backgroundColor: isDarkMode ? '#000' : '#f8f9fa',
        borderRadius: inCollection ? '0' : '12px',
        margin: inCollection ? '0' : '15px',
    };

    const iframeStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: 'inherit',
    };

    const headerStyle = {
        padding: '25px 25px 15px 25px',
        borderBottom: isDarkMode
            ? `1px solid rgba(${parseInt(accentColor.slice(1, 3), 16)}, ${parseInt(accentColor.slice(3, 5), 16)}, ${parseInt(accentColor.slice(5, 7), 16)}, 0.3)`
            : '1px solid rgba(0, 0, 0, 0.06)',
    };

    const titleStyle = {
        fontWeight: '600',
        color: isDarkMode ? '#e2e8f0' : '#2d3748',
        fontSize: '1.3rem',
        margin: 0,
        fontFamily: "'Poppins', sans-serif",
    };

    // Don't render if no video URL
    if (!exercise?.youtubeVideo || !videoId) {
        return null;
    }

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h3 style={titleStyle}>Exercise Video</h3>
            </div>

            <div style={videoContainerStyle}>
                {videoError ? (
                    <div style={{
                        color: isDarkMode ? '#fbb6ce' : '#e53e3e',
                        textAlign: 'center',
                        padding: '40px 20px',
                        fontSize: '1rem',
                    }}>
                        <p>Unable to load video. Please check the video URL.</p>
                    </div>
                ) : (
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                        title="Exercise Video"
                        style={iframeStyle}
                        allowFullScreen
                    />
                )}
            </div>
        </div>
    );
});

VideoSection.displayName = 'VideoSection';

export default VideoSection; 