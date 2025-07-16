import React from 'react';

const CarouselSkeleton = () => {
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

    const skeletonStyle = {
        backgroundColor: isDarkMode ? '#333' : '#e0e0e0',
        borderRadius: '15px',
        height: '400px', // Matches the approximate height of the carousel
        width: '100%',
        margin: '2rem 0',
        // animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    };

    return <div style={skeletonStyle} />;
};

export default CarouselSkeleton; 