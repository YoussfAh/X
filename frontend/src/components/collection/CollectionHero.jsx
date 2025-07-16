import React, { useState } from 'react';
import { FadeIn } from '../animations';

const CollectionHero = ({ collection, isDarkMode, windowWidth }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const heroSectionStyle = {
    position: 'relative',
    width: '100%',
    height: windowWidth <= 576 ? '300px' :
            windowWidth <= 768 ? '400px' :
            windowWidth <= 992 ? '450px' :
            '500px',
    overflow: 'hidden',
    borderRadius: '16px',
    marginBottom: '40px',
    boxShadow: isDarkMode
      ? '0 15px 40px rgba(0, 0, 0, 0.22)'
      : '0 15px 40px rgba(0, 0, 0, 0.06)',
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
  };

  const heroImageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'all 0.5s ease',
    filter: !imageLoaded ? 'blur(20px) brightness(0.8)' : 'none',
    transform: !imageLoaded ? 'scale(1.1)' : 'scale(1.0)',
    opacity: imageLoaded ? 1 : 0.8,
  };

  const heroOverlayStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '120px 30px 40px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
    color: '#fff',
    textAlign: 'center',
    opacity: imageLoaded ? 1 : 0,
    transition: 'opacity 0.3s ease',
  };

  return (
    <FadeIn>
      <div style={heroSectionStyle}>
        <img
          src={collection.image}
          alt={collection.name}
          style={heroImageStyle}
          className='collection-hero-image'
          loading="lazy"
          onLoad={() => {
            // Add a small delay to ensure smooth transition
            setTimeout(() => setImageLoaded(true), 50);
          }}
        />
        <div style={heroOverlayStyle}>
          <h1 style={{
            fontSize: windowWidth <= 576 ? '1.8rem' : '2.5rem',
            fontWeight: '700',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            margin: 0
          }}>
            {collection.name}
          </h1>
          {collection.description && (
            <p style={{
              fontSize: windowWidth <= 576 ? '1rem' : '1.2rem',
              opacity: 0.9,
              maxWidth: '800px',
              margin: '1rem auto 0',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
              {collection.description}
            </p>
          )}
        </div>
      </div>
    </FadeIn>
  );
};

export default React.memo(CollectionHero); 